import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Plus, Trash2, Upload, Download } from 'lucide-react';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    roll_number: '',
    class_id: '',
    section_id: '',
    contact_email: '',
    contact_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ class_id: '', section_id: '' });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (filter.class_id) {
      fetchSections(filter.class_id);
    }
  }, [filter.class_id]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API}/classes`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchSections = async (classId) => {
    try {
      const response = await axios.get(`${API}/classes/${classId}/sections`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setSections(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const params = {};
      if (filter.class_id) params.class_id = filter.class_id;
      if (filter.section_id) params.section_id = filter.section_id;

      const response = await axios.get(`${API}/students`, {
        headers: getAuthHeaders(),
        withCredentials: true,
        params
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/students`, formData, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setShowModal(false);
      setFormData({
        name: '',
        roll_number: '',
        class_id: '',
        section_id: '',
        contact_email: '',
        contact_phone: ''
      });
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await axios.delete(`${API}/students/${id}`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      fetchStudents();
    } catch (error) {
      alert('Failed to delete student');
    }
  };

  const handleClassChange = (classId) => {
    setFormData({ ...formData, class_id: classId, section_id: '' });
    if (classId) {
      fetchSections(classId);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-7 pp-animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Student Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all students across classes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-primary-foreground hover:opacity-90 rounded-lg px-4 py-2 font-medium flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="pp-card p-5 mb-6 pp-animate-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Filter by Class</label>
            <select
              value={filter.class_id}
              onChange={(e) => {
                setFilter({ ...filter, class_id: e.target.value, section_id: '' });
                fetchStudents();
              }}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Filter by Section</label>
            <select
              value={filter.section_id}
              onChange={(e) => {
                setFilter({ ...filter, section_id: e.target.value });
                fetchStudents();
              }}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground disabled:opacity-50"
              disabled={!filter.class_id}
            >
              <option value="">All Sections</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>{section.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilter({ class_id: '', section_id: '' });
                fetchStudents();
              }}
              className="w-full border border-border bg-card hover:bg-muted rounded-lg px-4 py-2 font-medium text-foreground transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="pp-card overflow-hidden pp-animate-in">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roll No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Section</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evaluations</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} className="border-t border-border hover:bg-muted transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">{student.roll_number}</td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{student.name}</td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{student.class_name}</td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{student.section_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {student.contact_email || student.contact_phone || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground tabular-nums whitespace-nowrap">{student.evaluation_count}</td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <span className={`font-semibold tabular-nums ${student.average_score >= 70 ? 'text-emerald-600' : student.average_score >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {student.average_score.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <button
                      onClick={() => deleteStudent(student.id)}
                      className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {students.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No students found. Add your first student!
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="pp-card p-8 rounded-2xl max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">Add New Student</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Roll Number *</label>
                <input
                  type="text"
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  required
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Class *</label>
                <select
                  value={formData.class_id}
                  onChange={(e) => handleClassChange(e.target.value)}
                  required
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Section *</label>
                <select
                  value={formData.section_id}
                  onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                  required
                  disabled={!formData.class_id}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground disabled:opacity-50"
                >
                  <option value="">Select Section</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground hover:opacity-90 rounded-lg px-4 py-2 font-medium disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add Student'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-border bg-card hover:bg-muted rounded-lg px-4 py-2 font-medium text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
