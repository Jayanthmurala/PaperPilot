import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, RefreshCw, Database, Zap, Users } from 'lucide-react';

const AnswerSubmission = () => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [syllabi, setSyllabi] = useState([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [formData, setFormData] = useState({
    class_id: '',
    class_name: '',
    section_id: '',
    section_name: '',
    student_id: '',
    student_name: '',
    subject: '',
    topic: '',
    exam_date: new Date().toISOString().split('T')[0], // Default to today
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [allPages, setAllPages] = useState([]); // Store all pages for multi-page PDFs
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSyllabi();
    fetchClasses();
  }, []);

  const fetchSyllabi = async () => {
    try {
      const response = await axios.get(`${API}/syllabus`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      if (response.data && Array.isArray(response.data)) {
        setSyllabi(response.data);
      }
    } catch (error) {
      console.error('Error fetching syllabi:', error);
      setError('Failed to load syllabi.');
    }
  };

  const fetchClasses = async () => {
    setClassesLoading(true);
    try {
      const response = await axios.get(`${API}/classes/`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setClasses(response.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchSections = async (classId) => {
    setSectionsLoading(true);
    try {
      const response = await axios.get(`${API}/classes/${classId}/sections`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setSections(response.data);
    } catch (err) {
      console.error('Error fetching sections:', err);
    } finally {
      setSectionsLoading(false);
    }
  };

  const fetchStudents = async (classId, sectionId) => {
    setStudentsLoading(true);
    try {
      const response = await axios.get(`${API}/students/`, {
        params: { class_id: classId, section_id: sectionId },
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setStudents(response.data);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleSelectSyllabus = (syl) => {
    setSelectedSyllabus(syl.id);
    setFormData(prev => ({
      ...prev,
      subject: syl.subject,
      topic: syl.topic || ''
    }));
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    const selectedClass = classes.find(c => c.id === classId);
    setFormData(prev => ({
      ...prev,
      class_id: classId,
      class_name: selectedClass ? selectedClass.name : '',
      section_id: '',
      section_name: '',
      student_id: '',
      student_name: ''
    }));
    setSections([]);
    setStudents([]);
    if (classId) fetchSections(classId);
  };

  const handleSectionChange = (e) => {
    const sectionId = e.target.value;
    const selectedSection = sections.find(s => s.id === sectionId);
    setFormData(prev => ({
      ...prev,
      section_id: sectionId,
      section_name: selectedSection ? selectedSection.name : '',
      student_id: '',
      student_name: ''
    }));
    setStudents([]);
    if (sectionId) fetchStudents(formData.class_id, sectionId);
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    const student = students.find(s => s.id === studentId);
    setFormData(prev => ({
      ...prev,
      student_id: studentId,
      student_name: student ? student.name : ''
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [selectedFileType, setSelectedFileType] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setSelectedFileType(file.type);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        // For PDFs, we don't show a preview of the content, but a PDF icon
        setImagePreview(null);
      }
    }
  };

  const handleOCR = async () => {
    if (!imageFile) {
      setError('Please select an image or PDF first');
      return;
    }

    setOcrLoading(true);
    setError('');

    try {
      const formDataOCR = new FormData();
      formDataOCR.append('file', imageFile);

      const response = await axios.post(`${API}/answer/ocr`, formDataOCR, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getAuthHeaders()
        },
        withCredentials: true
      });

      setOcrText(response.data.ocr_text);
      setImageBase64(response.data.image_base64);
      setAllPages(response.data.all_pages || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'OCR failed');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ocrText) {
      setError('Please perform OCR first');
      return;
    }
    if (!formData.subject) {
      setError('Please select a syllabus first');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${API}/answer/evaluate`, {
        student_id: formData.student_id || null,
        class_id: formData.class_id || null,
        class_name: formData.class_name || null,
        section_id: formData.section_id || null,
        section_name: formData.section_name || null,
        student_name: formData.student_name,
        subject: formData.subject,
        topic: formData.topic || null,
        ocr_text: ocrText,
        image_base64: imageBase64,
        all_pages: allPages,
        exam_date: formData.exam_date,
      }, {
        headers: getAuthHeaders(),
        withCredentials: true
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-card border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="min-h-screen bg-background p-6 md:p-8" data-testid="answer-submission-page">
      <div className="mb-7 pp-animate-in">
        <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="page-title">Submit Answer Script</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Upload handwritten answer for AI evaluation using RAG pipeline</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-6 flex items-center" data-testid="error-message">
          <AlertCircle className="mr-2" size={20} />
          {error}
        </div>
      )}

      {/* Evaluation Results (Multi-Question Support) */}
      {result && Array.isArray(result) && (
        <div className="pp-card pp-animate-in p-6 mb-6" data-testid="evaluation-result">
          <div className="flex items-center mb-6 text-emerald-700 border-b border-border pb-4">
            <CheckCircle className="mr-3" size={32} />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Evaluation Complete!</h2>
              <p className="text-sm text-muted-foreground">Individually scored {result.length} question{result.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="space-y-5">
            {result.map((item, index) => (
              <div key={index} className="pp-card p-0 overflow-hidden">
                {/* Header with Question and Score */}
                <div className="bg-muted/40 px-5 py-4 border-b border-border flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Question #{index + 1}</p>
                    <h3 className="font-semibold text-foreground leading-tight">{item.question || 'General Assessment'}</h3>
                  </div>
                  <div className="text-center bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                    <p className="text-[10px] uppercase font-semibold opacity-80 leading-none mb-1">Score</p>
                    <p className="text-xl font-bold leading-none">{item.score}<span className="text-xs font-normal">/100</span></p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted rounded-lg p-2 flex items-center gap-2 border border-border">
                      <div className="bg-accent p-1.5 rounded-md">
                        <Database size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">Similarity</p>
                        <p className="text-sm font-semibold text-foreground tabular-nums">{(item.similarity_score * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-2 flex items-center gap-2 border border-border">
                      <div className="bg-accent p-1.5 rounded-md">
                        <Zap size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">RAG Chunks</p>
                        <p className="text-sm font-semibold text-foreground tabular-nums">{item.retrieved_chunks}</p>
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText size={14} className="text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Explanation</p>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed bg-muted/50 p-3 rounded-lg border border-border">{item.explanation}</p>
                  </div>

                  {/* Taxonomy Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {item.matched_concepts?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase mb-2 ml-1">✓ Key Concepts Covered</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.matched_concepts.slice(0, 5).map((c, i) => (
                            <span key={i} className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-1 rounded-md border border-emerald-100 font-medium capitalize">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.missing_keywords?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-rose-500 uppercase mb-2 ml-1">✗ Missing Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.missing_keywords.slice(0, 5).map((k, i) => (
                            <span key={i} className="bg-rose-50 text-rose-700 text-[10px] px-2.5 py-1 rounded-md border border-rose-100 font-medium capitalize">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy/Single Result Support (Optional safety) */}
      {result && !Array.isArray(result) && (
        <div className="pp-card p-6 mb-6">
          <p className="text-center text-muted-foreground">Processing legacy evaluation data...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Image Upload + OCR */}
        <div className="pp-card p-5" data-testid="image-upload-section">
          <h2 className="text-[15px] font-semibold text-foreground mb-4 flex items-center">
            <Upload className="mr-2 text-primary" size={20} />
            Upload Answer Script
          </h2>

          <div className="mb-4">
            <label className={labelClass}>
              Select Script (Image or PDF)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              data-testid="image-input"
              onChange={handleImageChange}
              className={`${inputClass} text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground`}
            />
            <p className="text-xs text-muted-foreground mt-1">Supports multi-page PDF scans and high-res images.</p>
          </div>

          {(imagePreview || (imageFile && selectedFileType === 'application/pdf')) && (
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-2">Selected File:</p>
              <div className="relative group">
                {selectedFileType === 'application/pdf' ? (
                  <div className="bg-muted rounded-lg p-8 flex flex-col items-center justify-center border border-border">
                    <FileText size={48} className="text-primary mb-2" />
                    <p className="text-foreground text-sm font-medium">{imageFile.name}</p>
                    <p className="text-muted-foreground text-xs mt-1">PDF Document</p>
                  </div>
                ) : (
                  <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg border border-border w-full object-contain bg-muted" data-testid="image-preview" />
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleOCR}
            data-testid="ocr-button"
            disabled={!imageFile || ocrLoading}
            className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ocrLoading ? (
              <>
                <Loader className="mr-2 animate-spin" size={20} />
                Extracting Text...
              </>
            ) : (
              <>
                <FileText className="mr-2" size={20} />
                Process Handwritten Text
              </>
            )}
          </button>

          {ocrText && (
            <div className="mt-4 p-4 bg-muted rounded-lg border border-border" data-testid="ocr-result">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Extracted Text:</p>
                <span className="text-xs bg-card border border-border px-2 py-0.5 rounded uppercase font-semibold text-muted-foreground">Preview</span>
              </div>
              <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed max-h-40 overflow-y-auto">{ocrText}</p>
            </div>
          )}
        </div>

        {/* Right: Student Info + Syllabus Selection */}
        <div className="pp-card p-5" data-testid="student-info-section">
          <h2 className="text-[15px] font-semibold text-foreground mb-4 flex items-center">
            <Users className="mr-2 text-primary" size={20} />
            Link to Student &amp; Syllabus
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="submission-form">
            {/* Class, Section, Student Hierarchical Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Class
                </label>
                <select
                  value={formData.class_id}
                  onChange={handleClassChange}
                  className={inputClass}
                  disabled={classesLoading}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Section
                </label>
                <select
                  value={formData.section_id}
                  onChange={handleSectionChange}
                  className={inputClass}
                  disabled={sectionsLoading || !formData.class_id}
                >
                  <option value="">Select Section</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Student
              </label>
              <select
                value={formData.student_id}
                onChange={handleStudentChange}
                className={inputClass}
                disabled={studentsLoading || !formData.section_id}
              >
                <option value="">Select Student (Optional)</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.roll_number} - {s.name}</option>)}
              </select>
            </div>

            {/* Exam Date */}
            <div>
              <label className={labelClass}>
                Date of Exam *
              </label>
              <input
                type="date"
                name="exam_date"
                value={formData.exam_date}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="student_name">
                Student Name {formData.student_id ? '(linked)' : '(manual entry)'} *
              </label>
              <input
                type="text"
                id="student_name"
                name="student_name"
                data-testid="student-name-input"
                value={formData.student_name}
                onChange={handleChange}
                required
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring outline-none border ${formData.student_id ? 'bg-accent/40 border-primary/40 text-foreground font-medium' : 'bg-card border-border text-foreground'}`}
                placeholder="Enter student name"
              />
            </div>

            {/* Syllabus Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-foreground">
                  Reference Syllabus <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={fetchSyllabi}
                  className="text-primary hover:opacity-80 flex items-center text-xs font-medium"
                  data-testid="refresh-subjects-button"
                >
                  <RefreshCw size={12} className="mr-1" />
                  Update List
                </button>
              </div>

              {syllabi.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2 bg-muted/40">
                  {syllabi.map((syl, idx) => (
                    <button
                      key={syl.id || idx}
                      type="button"
                      onClick={() => handleSelectSyllabus(syl)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${selectedSyllabus === syl.id
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-card border-border text-foreground hover:border-primary hover:bg-accent/40'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold text-sm ${selectedSyllabus === syl.id ? 'text-primary-foreground' : 'text-foreground'}`}>
                            {syl.subject}
                          </p>
                          {syl.topic && <p className={`text-xs ${selectedSyllabus === syl.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>Topic: {syl.topic}</p>}
                        </div>
                        {selectedSyllabus === syl.id && (
                          <CheckCircle size={18} className="text-primary-foreground flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
                  <AlertCircle className="text-amber-500 mr-2 mt-0.5" size={16} />
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    No reference data found. Go to "Upload Syllabus" to add materials for the RAG engine to use.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              data-testid="submit-evaluation-button"
              disabled={loading || !ocrText || !formData.subject}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="mr-2 animate-spin" size={24} />
                  Evaluating via RAG...
                </>
              ) : (
                <>
                  <Zap className="mr-2" size={24} />
                  Run AI Evaluation
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AnswerSubmission;

