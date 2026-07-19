import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import { ThumbsUp, ThumbsDown, MessageSquare, CheckCircle, Image as ImageIcon, X, Search, Filter, Users, Star, BarChart3, AlertCircle, ClipboardCheck, Inbox } from 'lucide-react';

const gradeOf = (s) => (s >= 90 ? 'A' : s >= 75 ? 'B' : s >= 60 ? 'C' : s >= 40 ? 'D' : 'F');
// status tint, not decoration: pass / borderline / fail
const gradeTint = (g) =>
  g === 'A' || g === 'B'
    ? 'bg-emerald-50 text-emerald-700'
    : g === 'C'
    ? 'bg-amber-50 text-amber-700'
    : 'bg-rose-50 text-rose-700';

const Reviews = () => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [scriptModal, setScriptModal] = useState(null); // New state for script preview
  const [fetchingScript, setFetchingScript] = useState(false); // Loading state for full script
  const [feedbackText, setFeedbackText] = useState('');
  const [teacherScore, setTeacherScore] = useState('');
  const [conceptFeedback, setConceptFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(true);

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All'); // All, Pending, Reviewed

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const response = await axios.get(`${API}/evaluations`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setEvaluations(response.data);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openFeedbackModal = (evaluation, correct) => {
    setFeedbackModal(evaluation);
    setIsCorrect(correct);
    setFeedbackText('');
    setTeacherScore(evaluation.score.toString());
    setConceptFeedback('');
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      alert('Please provide feedback');
      return;
    }

    if (!teacherScore || teacherScore < 0 || teacherScore > 100) {
      alert('Please provide a valid score between 0 and 100');
      return;
    }

    try {
      const conceptList = conceptFeedback
        ? conceptFeedback.split(',').map(c => c.trim()).filter(c => c)
        : [];

      const response = await axios.post(`${API}/feedback`, {
        evaluation_id: feedbackModal.id,
        teacher_score: parseFloat(teacherScore),
        feedback: feedbackText,
        concept_feedback: conceptList,
        is_correct: isCorrect,
      }, {
        headers: getAuthHeaders(),
        withCredentials: true
      });

      // Show accuracy feedback
      if (response.data.accuracy !== undefined) {
        alert(`Feedback submitted! Model accuracy: ${response.data.accuracy.toFixed(1)}%\nScore difference: ${response.data.score_difference.toFixed(1)}`);
      }

      // Refresh evaluations
      await fetchEvaluations();
      setFeedbackModal(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    }
  };

  const fetchFullScript = async (evaluationId) => {
    setFetchingScript(true);
    try {
      const response = await axios.get(`${API}/evaluations/${evaluationId}/full`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setScriptModal(response.data);
    } catch (error) {
      console.error('Error fetching script:', error);
      alert('Failed to load full script preview');
    } finally {
      setFetchingScript(false);
    }
  };

  const filteredEvaluations = evaluations.filter(ev => {
    const matchesSearch = ev.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.question && ev.question.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = filterSubject === 'All' || ev.subject === filterSubject;
    const matchesClass = filterClass === 'All' || (ev.class_name && ev.class_name === filterClass);
    const matchesStatus = filterStatus === 'All' ||
      (filterStatus === 'Reviewed' && ev.feedback) ||
      (filterStatus === 'Pending' && !ev.feedback);

    return matchesSearch && matchesSubject && matchesClass && matchesStatus;
  });

  const subjects = ['All', ...new Set(evaluations.map(e => e.subject).filter(Boolean))];
  const classes = ['All', ...new Set(evaluations.map(e => e.class_name).filter(Boolean))];

  const stats = {
    total: evaluations.length,
    pending: evaluations.filter(e => !e.feedback).length,
    reviewed: evaluations.filter(e => e.feedback).length,
    avgScore: evaluations.length > 0 ? (evaluations.reduce((acc, e) => acc + e.score, 0) / evaluations.length).toFixed(1) : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8" data-testid="reviews-loading">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
        </div>
        <div className="mt-6 h-16 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8" data-testid="reviews-page">
      {/* Header & Stats Dashboard */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pp-animate-in">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ClipboardCheck size={19} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="page-title">
              Evaluation Hub
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">Review AI grading and record faculty feedback</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full md:w-auto">
          {[
            { label: 'Total', value: stats.total, icon: BarChart3 },
            { label: 'Pending', value: stats.pending, icon: AlertCircle },
            { label: 'Reviewed', value: stats.reviewed, icon: CheckCircle },
            { label: 'Avg AI Score', value: stats.avgScore, icon: Star }
          ].map((stat, i) => (
            <div key={i} className="pp-card p-5 pp-animate-in min-w-[140px]" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <stat.icon size={17} strokeWidth={2} className="text-muted-foreground/70" />
              </div>
              <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight text-foreground tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="pp-card p-4 mb-10 flex flex-wrap items-center gap-4 sticky top-4 z-30">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search student or question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-card rounded-lg border border-border">
            <Filter size={14} className="text-muted-foreground" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-foreground focus:ring-0 outline-none cursor-pointer"
            >
              {subjects.map(s => <option key={s} value={s}>{s === 'All' ? 'Subject: All' : s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-card rounded-lg border border-border">
            <Users size={14} className="text-muted-foreground" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-foreground focus:ring-0 outline-none cursor-pointer"
            >
              {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'Class: All' : c}</option>)}
            </select>
          </div>

          <div className="flex bg-muted p-1 rounded-lg">
            {['All', 'Pending', 'Reviewed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${filterStatus === status ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredEvaluations.length === 0 ? (
        <div className="pp-card p-16 text-center" data-testid="no-evaluations">
          <div className="flex flex-col items-center justify-center gap-3">
            <Inbox className="text-muted-foreground/30" size={40} />
            <p className="text-sm text-muted-foreground">No matches found. Try adjusting your filters or search terms.</p>
            <button
              onClick={() => { setSearchTerm(''); setFilterSubject('All'); setFilterClass('All'); setFilterStatus('All'); }}
              className="mt-2 text-sm font-medium text-primary hover:opacity-90"
            >
              Clear all filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(
            filteredEvaluations.reduce((acc, evalItem) => {
              const subject = evalItem.subject || 'Uncategorized';
              const classSection = evalItem.class_name && evalItem.section_name
                ? `${evalItem.class_name} - ${evalItem.section_name}`
                : 'Individual Submissions';

              if (!acc[subject]) acc[subject] = {};
              if (!acc[subject][classSection]) acc[subject][classSection] = [];
              acc[subject][classSection].push(evalItem);
              return acc;
            }, {})
          ).map(([subject, sections]) => (
            <div key={subject} className="space-y-8">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{subject}</h2>
                <div className="h-px flex-1 bg-border"></div>
              </div>

              {Object.entries(sections).map(([sectionName, sectionEvals]) => (
                <div key={sectionName} className="pp-card p-5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-foreground">{sectionName}</h3>
                        <p className="text-xs text-muted-foreground">{sectionEvals.length} Evaluation{sectionEvals.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sectionEvals.map((evaluation, i) => {
                      const grade = gradeOf(evaluation.score);
                      return (
                      <div key={evaluation.id} className="pp-card pp-card-hover pp-animate-in p-5 flex flex-col" style={{ animationDelay: `${i * 60}ms` }} data-testid={`evaluation-card-${evaluation.id}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-[15px] font-semibold text-foreground" data-testid="student-name">{evaluation.student_name}</h3>
                              {evaluation.exam_date && (
                                <span className="bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
                                  {new Date(evaluation.exam_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Topic: {evaluation.topic || 'General'}
                            </p>
                            <button
                              onClick={() => fetchFullScript(evaluation.id)}
                              className="mt-2 flex items-center gap-1.5 px-2.5 py-1 border border-border bg-card hover:bg-muted rounded-lg text-xs font-medium text-foreground transition-all active:scale-95 disabled:opacity-50"
                              disabled={fetchingScript}
                            >
                              <ImageIcon size={12} /> {fetchingScript ? 'Opening...' : 'View Script'}
                            </button>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${gradeTint(grade)}`}>
                                {grade}
                              </span>
                              <div className="text-2xl font-semibold text-foreground tabular-nums leading-none" data-testid="evaluation-score">
                                {evaluation.score}<span className="text-xs font-normal text-muted-foreground">/100</span>
                              </div>
                            </div>
                            {evaluation.feedback && (
                              <div className="flex items-center text-emerald-700" data-testid="feedback-indicator">
                                <CheckCircle size={12} className="mr-1" />
                                <span className="text-[10px] font-medium uppercase tracking-wider">Reviewed</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {evaluation.question && (
                          <div className="mb-4 p-3 bg-muted rounded-lg">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Question</p>
                            <p className="text-foreground text-xs leading-tight line-clamp-2">{evaluation.question}</p>
                          </div>
                        )}

                        <div className="mb-4 p-4 bg-muted rounded-lg flex-1">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">AI Explanation</p>
                          <p className="text-foreground text-xs leading-relaxed" data-testid="evaluation-explanation">{evaluation.explanation}</p>
                        </div>

                        {evaluation.feedback && (
                          <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100" data-testid="faculty-feedback">
                            <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-widest mb-2">Faculty Correction</p>
                            <p className="text-foreground text-xs leading-relaxed">{evaluation.feedback}</p>
                            {evaluation.feedback_score !== undefined && (
                              <p className="text-xs font-semibold text-emerald-700 mt-2 pt-2 border-t border-emerald-100">
                                Verified Score: {evaluation.feedback_score}/100
                              </p>
                            )}
                          </div>
                        )}

                        {!evaluation.feedback && (
                          <div className="flex gap-2 mt-auto">
                            <button
                              onClick={() => openFeedbackModal(evaluation, true)}
                              data-testid="correct-button"
                              className="flex-1 bg-primary text-primary-foreground py-2 px-3 rounded-lg text-xs font-medium hover:opacity-90 transition-all flex items-center justify-center active:scale-95"
                            >
                              <ThumbsUp className="mr-1.5" size={14} />
                              Agree
                            </button>
                            <button
                              onClick={() => openFeedbackModal(evaluation, false)}
                              data-testid="incorrect-button"
                              className="flex-1 border border-border bg-card text-foreground py-2 px-3 rounded-lg text-xs font-medium hover:bg-muted transition-all flex items-center justify-center active:scale-95"
                            >
                              <ThumbsDown className="mr-1.5" size={14} />
                              Correct AI
                            </button>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {feedbackModal && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="feedback-modal">
          <div className="pp-card rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
              Teacher Evaluation &amp; Feedback
            </h2>

            <div className="mb-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold text-muted-foreground mb-2">AI Evaluation</p>
              <p className="text-lg font-semibold text-foreground">Score: {feedbackModal.score}/100</p>
              <p className="text-sm text-muted-foreground mt-2">{feedbackModal.explanation}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Your Evaluated Score (0-100) *
              </label>
              <input
                type="number"
                data-testid="teacher-score-input"
                value={teacherScore}
                onChange={(e) => setTeacherScore(e.target.value)}
                min="0"
                max="100"
                required
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
                placeholder="Enter your score for this answer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Difference from AI: {Math.abs(feedbackModal.score - (parseFloat(teacherScore) || 0)).toFixed(1)} points
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Detailed Feedback (Paragraph) *
              </label>
              <textarea
                data-testid="feedback-textarea"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={6}
                required
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
                placeholder="Provide detailed feedback on the evaluation. Explain why you gave this score, what concepts were correct/incorrect, and areas for improvement..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                This helps the AI learn better evaluation patterns
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Concept Feedback (Optional)
              </label>
              <textarea
                data-testid="concept-feedback-textarea"
                value={conceptFeedback}
                onChange={(e) => setConceptFeedback(e.target.value)}
                rows={3}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
                placeholder="List specific concepts that were well-explained or missing (comma separated)&#10;Example: Stack operations correct, Queue concept missing, LIFO explained well"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Overall AI Evaluation Quality
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsCorrect(true)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${isCorrect
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                    }`}
                >
                  Good Evaluation
                </button>
                <button
                  type="button"
                  onClick={() => setIsCorrect(false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${!isCorrect
                    ? 'bg-destructive text-destructive-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                    }`}
                >
                  Needs Improvement
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={submitFeedback}
                data-testid="submit-feedback-button"
                className="flex-1 bg-primary text-primary-foreground py-2 px-6 rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center"
              >
                <MessageSquare className="mr-2" size={18} />
                Submit Feedback
              </button>
              <button
                onClick={() => setFeedbackModal(null)}
                data-testid="cancel-feedback-button"
                className="flex-1 border border-border bg-card text-foreground py-2 px-6 rounded-lg font-medium hover:bg-muted transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Script Preview Modal */}
      {scriptModal && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="pp-card rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Student Answer Script</h2>
                <p className="text-xs text-muted-foreground">{scriptModal.student_name} • {scriptModal.subject}</p>
              </div>
              <button
                onClick={() => setScriptModal(null)}
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/40 flex flex-col items-center gap-8">
              {scriptModal.all_pages && scriptModal.all_pages.length > 0 ? (
                scriptModal.all_pages.map((page, idx) => (
                  <div key={idx} className="relative group">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2 text-center">Page {idx + 1}</p>
                    <img
                      src={`data:image/png;base64,${page}`}
                      alt={`Page ${idx + 1}`}
                      className="max-w-full h-auto rounded-xl shadow-lg border border-border transition-transform hover:scale-[1.01]"
                    />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                  <AlertCircle size={40} className="text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No script data available</p>
                </div>
              )}
            </div>

            <div className="px-8 py-4 border-t border-border text-center">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.2em]">End of Script Preview</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
