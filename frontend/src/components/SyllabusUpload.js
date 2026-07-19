import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Upload, CheckCircle, AlertCircle, FileText, Image as ImageIcon, X } from 'lucide-react';

const SyllabusUpload = () => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'text'
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    topic: '',
    content: '',
  });
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [questionPaperFile, setQuestionPaperFile] = useState(null);
  const [syllabusPreview, setSyllabusPreview] = useState('');
  const [questionPreview, setQuestionPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSyllabusFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSyllabusFile(file);

      // Preview for text files
      if (file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSyllabusPreview(e.target.result);
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.pdf')) {
        setSyllabusPreview('PDF file selected - preview will be generated after upload');
      }
    }
  };

  const handleQuestionPaperChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQuestionPaperFile(file);

      // Preview for images
      const reader = new FileReader();
      reader.onloadend = () => {
        setQuestionPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('subject', formData.subject);
      if (formData.topic) formDataToSend.append('topic', formData.topic);
      if (syllabusFile) formDataToSend.append('syllabus_file', syllabusFile);
      if (questionPaperFile) formDataToSend.append('question_paper', questionPaperFile);

      const response = await axios.post(`${API}/syllabus/upload-file`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getAuthHeaders()
        },
        withCredentials: true
      });

      setSuccess(true);

      // Show previews from response
      if (response.data.content_preview) {
        setSyllabusPreview(response.data.content_preview);
      }
      if (response.data.questions_preview) {
        alert(`Questions extracted:\n${response.data.questions_preview}`);
      }

      // Reset form
      setFormData({ title: '', subject: '', topic: '', content: '' });
      setSyllabusFile(null);
      setQuestionPaperFile(null);
      setQuestionPreview('');

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload files');
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await axios.post(`${API}/syllabus/upload`, {
        title: formData.title,
        subject: formData.subject,
        topic: formData.topic || null,
        content: formData.content,
      }, {
        headers: getAuthHeaders(),
        withCredentials: true
      });

      setSuccess(true);
      setFormData({ title: '', subject: '', topic: '', content: '' });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload syllabus');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-card border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="min-h-screen bg-background p-6 md:p-8" data-testid="syllabus-upload-page">
      <div className="mb-7 pp-animate-in">
        <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="page-title">Upload Syllabus &amp; Question Paper</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Add reference material and questions for answer evaluation</p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-3 mb-6 pp-animate-in">
        <button
          onClick={() => setUploadMode('file')}
          className={`flex-1 rounded-lg px-4 py-2.5 font-medium transition-colors flex items-center justify-center ${uploadMode === 'file'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-foreground hover:bg-muted'
            }`}
          data-testid="file-mode-button"
        >
          <FileText className="mr-2" size={18} />
          Upload Files (PDF/TXT + Question Paper)
        </button>
        <button
          onClick={() => setUploadMode('text')}
          className={`flex-1 rounded-lg px-4 py-2.5 font-medium transition-colors flex items-center justify-center ${uploadMode === 'text'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-foreground hover:bg-muted'
            }`}
          data-testid="text-mode-button"
        >
          <FileText className="mr-2" size={18} />
          Manual Text Entry
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 flex items-center" data-testid="success-message">
          <CheckCircle className="mr-2" size={20} />
          Syllabus uploaded and processed successfully!
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-6 flex items-center" data-testid="error-message">
          <AlertCircle className="mr-2" size={20} />
          {error}
        </div>
      )}

      {uploadMode === 'file' ? (
        <form onSubmit={handleFileSubmit} className="space-y-6" data-testid="file-upload-form">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - File Uploads */}
            <div className="pp-card p-5">
              <h2 className="text-[15px] font-semibold text-foreground mb-4">Files</h2>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    data-testid="title-input"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    placeholder="e.g., Data Structures - Chapter 1"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    data-testid="subject-input"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    placeholder="e.g., Data Structures"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Topic (Optional)
                  </label>
                  <input
                    type="text"
                    name="topic"
                    data-testid="topic-input"
                    value={formData.topic}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g., Stack and Queue"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Syllabus/Notes File (PDF or TXT) *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    data-testid="syllabus-file-input"
                    onChange={handleSyllabusFileChange}
                    required
                    className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground`}
                  />
                  {syllabusFile && (
                    <p className="text-sm text-emerald-600 mt-2">
                      ✓ {syllabusFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    Question Paper Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    data-testid="question-paper-input"
                    onChange={handleQuestionPaperChange}
                    className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground`}
                  />
                  {questionPaperFile && (
                    <p className="text-sm text-emerald-600 mt-2">
                      ✓ {questionPaperFile.name}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  data-testid="upload-files-button"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <Upload className="mr-2" size={20} />
                      Upload &amp; Process
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column - Previews */}
            <div className="space-y-6">
              {syllabusPreview && (
                <div className="pp-card p-5" data-testid="syllabus-preview">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-semibold text-foreground">Syllabus Preview</h3>
                    <button onClick={() => setSyllabusPreview('')} className="text-muted-foreground hover:text-foreground">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto bg-muted p-4 rounded-lg">
                    <pre className="text-sm text-foreground whitespace-pre-wrap">{syllabusPreview}</pre>
                  </div>
                </div>
              )}

              {questionPreview && (
                <div className="pp-card p-5" data-testid="question-preview">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-semibold text-foreground">Question Paper Preview</h3>
                    <button onClick={() => setQuestionPreview('')} className="text-muted-foreground hover:text-foreground">
                      <X size={20} />
                    </button>
                  </div>
                  <img src={questionPreview} alt="Question Paper" className="max-h-96 rounded-lg border border-border" />
                </div>
              )}
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleTextSubmit} className="pp-card p-6" data-testid="text-upload-form">
          <div className="space-y-5">
            <div>
              <label className={labelClass}>
                Title *
              </label>
              <input
                type="text"
                name="title"
                data-testid="title-input-text"
                value={formData.title}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="e.g., Operating Systems - Chapter 5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  data-testid="subject-input-text"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="e.g., Operating Systems"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Topic (Optional)
                </label>
                <input
                  type="text"
                  name="topic"
                  data-testid="topic-input-text"
                  value={formData.topic}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g., Page Replacement Algorithms"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Content / Notes *
              </label>
              <textarea
                name="content"
                data-testid="content-textarea"
                value={formData.content}
                onChange={handleChange}
                required
                rows={12}
                className={inputClass}
                placeholder="Paste your syllabus or notes content here..."
              />
            </div>

            <button
              type="submit"
              data-testid="upload-text-button"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Upload className="mr-2" size={20} />
                  Upload Syllabus
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SyllabusUpload;
