import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Trash2, AlertCircle, CheckCircle, BookOpen, Search, Eye, Edit3, X, FileText, HelpCircle, Save, Image as ImageIcon } from 'lucide-react';

const SubjectManagement = () => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [syllabi, setSyllabi] = useState([]);
  const [subjects, setSubjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [viewMode, setViewMode] = useState(null); // 'content', 'questions', 'file_original', 'paper_original'
  const [editQuestions, setEditQuestions] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  useEffect(() => {
    fetchSyllabi();
  }, []);

  const fetchFullDetails = async (sylId, mode) => {
    setFetchingDetails(true);
    try {
      const response = await axios.get(`${API}/syllabus/${sylId}`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setSelectedSyllabus(response.data);
      setViewMode(mode);
      if (mode === 'questions') {
        setEditQuestions(response.data.questions_text || '');
      }
    } catch (err) {
      setError('Failed to fetch file details.');
    } finally {
      setFetchingDetails(false);
    }
  };

  const fetchSyllabi = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/syllabus`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setSyllabi(response.data);
      groupSyllabi(response.data);
    } catch (error) {
      console.error('Error fetching syllabi:', error);
      setError('Failed to load syllabi.');
    } finally {
      setLoading(false);
    }
  };

  const groupSyllabi = (data) => {
    const grouped = {};
    data.forEach(syl => {
      if (!grouped[syl.subject]) {
        grouped[syl.subject] = [];
      }
      grouped[syl.subject].push(syl);
    });
    setSubjects(grouped);
  };

  const handleUpdateQuestions = async () => {
    if (!selectedSyllabus) return;
    setUpdateLoading(true);
    try {
      await axios.put(`${API}/syllabus/${selectedSyllabus.id}`, {
        questions_text: editQuestions
      }, {
        headers: getAuthHeaders(),
        withCredentials: true
      });

      setSuccess('Question paper updated successfully!');
      fetchSyllabi();
      setViewMode(null);
      setSelectedSyllabus(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update questions.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteSyllabus = async (syllabusId, title) => {
    if (!window.confirm(`Delete syllabus "${title}"?`)) return;
    setDeleteLoading(syllabusId);
    try {
      await axios.delete(`${API}/syllabus/${syllabusId}`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setSuccess(`Syllabus deleted successfully`);
      fetchSyllabi();
    } catch (err) {
      setError('Failed to delete syllabus');
    } finally {
      setDeleteLoading(null);
    }
  };

  const deleteSubject = async (subject) => {
    if (!window.confirm(`Delete all entries for "${subject}"?`)) return;
    setDeleteLoading(subject);
    try {
      await axios.delete(`${API}/syllabus/subject/${encodeURIComponent(subject)}`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setSuccess(`Subject deleted successfully`);
      fetchSyllabi();
    } catch (err) {
      setError('Failed to delete subject');
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredSubjects = Object.entries(subjects).filter(([subject, list]) =>
    subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.some(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSyllabi = syllabi.length;
  const totalQuestions = syllabi.filter(s => !!s.questions_text).length;

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="h-24 w-64 animate-pulse rounded-2xl bg-muted"></div></div>;

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7 pp-animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Management Hub</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Control subjects, syllabus versions, and question banks</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="pp-card px-4 py-2.5 flex items-center gap-3">
            <div className="bg-accent p-2 rounded-lg text-primary"><BookOpen size={20} /></div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Total Syllabi</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{totalSyllabi}</p>
            </div>
          </div>
          <div className="pp-card px-4 py-2.5 flex items-center gap-3">
            <div className="bg-accent p-2 rounded-lg text-primary"><HelpCircle size={20} /></div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Linked Papers</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{totalQuestions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mb-7 group pp-animate-in">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
        <input
          type="text"
          placeholder="Search by subject, title, or topic..."
          className="w-full bg-card border border-border rounded-lg py-2.5 pl-11 pr-4 focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all text-foreground"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg mb-6 flex items-center">
          <CheckCircle className="mr-3" size={20} />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg mb-6 flex items-center">
          <AlertCircle className="mr-3" size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {filteredSubjects.length === 0 ? (
        <div className="pp-card p-20 text-center">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
            <Search className="text-muted-foreground/50" size={32} />
          </div>
          <p className="text-sm text-muted-foreground">No results found for "{searchTerm}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredSubjects.map(([subject, syllabusList]) => (
            <div key={subject} className="pp-card pp-animate-in overflow-hidden !p-0">
              <div className="bg-muted/40 px-6 py-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground tracking-tight">{subject}</h2>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{syllabusList.length} Syllabus Modules</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => deleteSubject(subject)}
                    className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-destructive rounded-lg font-medium text-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                    Mass Clear
                  </button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {syllabusList.map((syl) => (
                  <div key={syl.id} className="group pp-card pp-card-hover p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground leading-tight text-sm mb-1">{syl.title}</h3>
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Topic: {syl.topic || 'General'}</p>
                      </div>
                      <button onClick={() => deleteSyllabus(syl.id, syl.title)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-6 flex-wrap">
                      {syl.questions_text ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                          <CheckCircle size={10} />
                          <span className="text-[9px] font-semibold uppercase">Paper Linked</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted text-muted-foreground rounded-md border border-border">
                          <AlertCircle size={10} />
                          <span className="text-[9px] font-semibold uppercase">No Paper</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-accent text-primary rounded-md border border-border">
                        <FileText size={10} />
                        <span className="text-[9px] font-semibold uppercase">{syl.content.length} chars</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-border flex-wrap">
                      <button
                        onClick={() => { setSelectedSyllabus(syl); setViewMode('content'); }}
                        className="px-3 py-1.5 border border-border bg-card text-foreground rounded-lg text-[10px] font-semibold uppercase tracking-wide hover:bg-muted transition-colors flex items-center gap-1"
                      >
                        <Eye size={12} /> Info
                      </button>
                      {/* <button
                        onClick={() => fetchFullDetails(syl.id, 'file_original')}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1"
                        disabled={fetchingDetails}
                      >
                        <FileText size={12} /> View Doc
                      </button> */}
                      <button
                        onClick={() => fetchFullDetails(syl.id, 'questions')}
                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity flex items-center gap-1"
                        disabled={fetchingDetails}
                      >
                        <Edit3 size={12} /> Paper
                      </button>
                      {syl.questions_text && (
                        <button
                          onClick={() => fetchFullDetails(syl.id, 'paper_original')}
                          className="px-3 py-1.5 border border-border bg-card text-foreground rounded-lg text-[10px] font-semibold uppercase tracking-wide hover:bg-muted transition-colors flex items-center gap-1"
                          disabled={fetchingDetails}
                        >
                          <ImageIcon size={12} /> Scan
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Backdrop */}
      {viewMode && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {viewMode === 'content' && 'Syllabus Info'}
                  {viewMode === 'questions' && 'Question Bank'}
                  {viewMode === 'file_original' && 'Original Document'}
                  {viewMode === 'paper_original' && 'Original Question Paper'}
                </h2>
                <p className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-sm">
                  {selectedSyllabus?.title}
                </p>
              </div>
              <button onClick={() => { setViewMode(null); setSelectedSyllabus(null); }} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
              {fetchingDetails ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="h-12 w-12 animate-pulse rounded-2xl bg-muted"></div>
                  <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Retrieving File...</p>
                </div>
              ) : (
                <>
                  {viewMode === 'content' && (
                    <div className="pp-card p-6">
                      <h4 className="text-[10px] font-semibold uppercase text-muted-foreground mb-4 tracking-widest">Extracted Text Content</h4>
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed text-sm italic">"{selectedSyllabus?.content}"</p>
                    </div>
                  )}

                  {viewMode === 'questions' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest px-1">Raw Question Paper Text (Extracted via OCR)</label>
                      <textarea
                        value={editQuestions}
                        onChange={(e) => setEditQuestions(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg p-6 text-sm text-foreground leading-relaxed outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all min-h-[400px]"
                        placeholder="Paste or edit the question paper text here..."
                      />
                    </div>
                  )}

                  {viewMode === 'file_original' && (
                    <div className="w-full h-full flex items-center justify-center min-h-[500px]">
                      {selectedSyllabus?.original_file_b64 ? (
                        selectedSyllabus.original_file_b64.startsWith('JVBERi') || selectedSyllabus.original_file_b64.length > 1000 ? (
                          <embed
                            src={`data:application/pdf;base64,${selectedSyllabus.original_file_b64}`}
                            type="application/pdf"
                            className="w-full h-[70vh] rounded-xl shadow-lg border border-border"
                          />
                        ) : (
                          <div className="pp-card p-12 text-center">
                            <FileText className="mx-auto text-muted-foreground/30 mb-4" size={64} />
                            <p className="text-muted-foreground font-medium uppercase text-xs">File format not previewable as Image/PDF</p>
                          </div>
                        )
                      ) : (
                        <div className="pp-card p-12 text-center">
                          <AlertCircle className="mx-auto text-amber-300 mb-4" size={64} />
                          <p className="text-muted-foreground font-medium uppercase text-xs">No original file stored for this entry</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-2">Only files uploaded AFTER this update will show here.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {viewMode === 'paper_original' && (
                    <div className="w-full flex items-center justify-center p-4">
                      {selectedSyllabus?.question_paper ? (
                        <img
                          src={`data:image/png;base64,${selectedSyllabus.question_paper}`}
                          alt="Original Question Paper"
                          className="max-w-full h-auto rounded-xl shadow-lg border border-border"
                        />
                      ) : (
                        <div className="pp-card p-12 text-center">
                          <ImageIcon className="mx-auto text-muted-foreground/30 mb-4" size={64} />
                          <p className="text-muted-foreground font-medium uppercase text-xs">No image scan available</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {viewMode === 'questions' && !fetchingDetails && (
              <div className="px-6 py-5 bg-card border-t border-border flex items-center justify-between sticky bottom-0">
                <p className="text-xs text-muted-foreground">You can manually refine the OCR results above.</p>
                <button
                  onClick={handleUpdateQuestions}
                  disabled={updateLoading}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  {updateLoading ? 'Updating...' : <><Save size={16} /> Save Paper</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
