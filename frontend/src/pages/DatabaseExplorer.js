import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import {
    Database, Table, ChevronLeft, ChevronRight, Eye, X,
    RefreshCw, Layers, Hash, FileText, Code, Zap, Lock,
    Search, Trash2, Calendar, HardDrive, Cpu
} from 'lucide-react';

const DatabaseExplorer = () => {
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const [isAuthorized, setIsAuthorized] = useState(sessionStorage.getItem('db_auth') === 'true');
    const [passcode, setPasscode] = useState('');
    const [authError, setAuthError] = useState('');
    const [collections, setCollections] = useState([]);
    const [dbName, setDbName] = useState('');
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [collectionData, setCollectionData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [detailDoc, setDetailDoc] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthorized) {
            fetchCollections();
        }
    }, [isAuthorized]);

    const handleAuth = (e) => {
        e.preventDefault();
        // The passcode as requested by the user
        if (passcode === '4-2-2026@DB') {
            setIsAuthorized(true);
            sessionStorage.setItem('db_auth', 'true');
            setAuthError('');
        } else {
            setAuthError('Access denied. Invalid passcode.');
        }
    };

    const fetchCollections = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API}/database/collections`, {
                headers: getAuthHeaders(),
                withCredentials: true
            });
            setCollections(response.data.collections || []);
            setDbName(response.data.database || '');
            setError('');
        } catch (err) {
            setError('Failed to connect to cluster');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const selectCollection = async (name, page = 1) => {
        setLoading(true);
        setSelectedCollection(name);
        setCurrentPage(page);
        try {
            const response = await axios.get(`${API}/database/collection/${name}?page=${page}&limit=12`, {
                headers: getAuthHeaders(),
                withCredentials: true
            });
            setCollectionData(response.data);
            setError('');
        } catch (err) {
            setError(`Error reading collection: ${name}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const viewDocument = async (doc) => {
        const docId = doc._id || doc.id || doc.evaluation_id || doc.student_id;
        if (selectedCollection && docId) {
            setLoading(true);
            try {
                const response = await axios.get(`${API}/database/document/${selectedCollection}/${docId}`, {
                    headers: getAuthHeaders(),
                    withCredentials: true
                });
                setDetailDoc(response.data);
                setShowDetail(true);
            } catch (err) {
                setDetailDoc({ collection: selectedCollection, document: doc, rag_data: null });
                setShowDetail(true);
            } finally {
                setLoading(false);
            }
        } else {
            setDetailDoc({ collection: selectedCollection, document: doc, rag_data: null });
            setShowDetail(true);
        }
    };

    const deleteDocument = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document? This action is irreversible.')) return;

        try {
            await axios.delete(`${API}/database/document/${selectedCollection}/${id}`, {
                headers: getAuthHeaders(),
                withCredentials: true
            });
            selectCollection(selectedCollection, currentPage); // Refresh
        } catch (err) {
            alert('Delete failed');
        }
    };

    const getFieldTypeInfo = (type) => {
        if (type.includes('str')) return { label: 'string', color: 'text-emerald-600' };
        if (type.includes('int') || type.includes('float')) return { label: 'number', color: 'text-primary' };
        if (type.includes('bool')) return { label: 'boolean', color: 'text-amber-600' };
        if (type.includes('list')) return { label: 'array', color: 'text-primary' };
        if (type.includes('dict')) return { label: 'object', color: 'text-muted-foreground' };
        return { label: 'any', color: 'text-muted-foreground' };
    };

    const renderValue = (val) => {
        if (val === null || val === undefined) return <span className="text-muted-foreground/50 font-mono">null</span>;
        if (typeof val === 'boolean') return <span className={`font-mono font-bold ${val ? 'text-emerald-600' : 'text-rose-600'}`}>{val.toString()}</span>;
        if (typeof val === 'number') return <span className="text-foreground font-mono tabular-nums">{val}</span>;
        if (Array.isArray(val)) return <span className="text-muted-foreground font-mono italic">Array({val.length})</span>;
        if (typeof val === 'object') return <span className="text-muted-foreground font-mono italic">Object</span>;

        const s = String(val);
        return <span className="text-foreground font-mono text-xs">{s.length > 50 ? s.substring(0, 50) + '...' : s}</span>;
    };

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-6">
                <div className="w-full max-w-md pp-card p-8 rounded-2xl pp-animate-in">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-accent text-primary rounded-xl">
                            <Lock size={24} />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-center text-foreground mb-2">Restricted Area</h2>
                    <p className="text-sm text-muted-foreground text-center mb-8">Enter administrative credentials to manage database.</p>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Passcode</label>
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring outline-none font-mono text-foreground"
                                placeholder="••••••••"
                                autoFocus
                            />
                        </div>
                        {authError && <p className="text-xs text-destructive font-medium">{authError}</p>}
                        <button className="w-full bg-primary text-primary-foreground hover:opacity-90 rounded-lg px-4 py-2.5 font-medium transition-opacity">
                            Verify Identity
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-8 max-w-[1600px] mx-auto">
            {/* Direct & Functional Header */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-7 border-b border-border pb-6 pp-animate-in">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Database className="text-muted-foreground" size={24} />
                        Database Manager
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded">
                            <HardDrive size={12} /> {dbName || 'localhost'}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded">
                            <Cpu size={12} /> {collections.length} Collections
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchCollections}
                        className="flex items-center gap-2 border border-border bg-card hover:bg-muted rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Sync Cluster
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Clean Collection Selector (Side Panel) */}
                <div className="col-span-12 lg:col-span-3 space-y-4">
                    <div className="pp-card overflow-hidden pp-animate-in">
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collections</h2>
                            <Search size={14} className="text-muted-foreground" />
                        </div>
                        <div className="overflow-y-auto max-h-[70vh]">
                            {collections.length === 0 && <p className="p-4 text-xs text-muted-foreground italic">No nodes detected.</p>}
                            {collections.map(col => (
                                <button
                                    key={col.name}
                                    onClick={() => selectCollection(col.name)}
                                    className={`w-full text-left px-4 py-3.5 border-t border-border transition-colors flex items-center justify-between group ${selectedCollection === col.name ? 'bg-accent' : 'hover:bg-muted'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Table size={16} className={selectedCollection === col.name ? 'text-primary' : 'text-muted-foreground'} />
                                        <span className={`text-sm font-medium ${selectedCollection === col.name ? 'text-primary' : 'text-foreground'}`}>
                                            {col.name}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground tabular-nums">
                                        {col.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Data View (Main Area) */}
                <div className="col-span-12 lg:col-span-9">
                    {!collectionData ? (
                        <div className="h-64 flex flex-col items-center justify-center pp-card border-dashed">
                            <Database size={48} className="text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground font-medium">Select a collection to view records.</p>
                        </div>
                    ) : (
                        <div className="pp-card overflow-hidden flex flex-col pp-animate-in">
                            {/* Collection Header */}
                            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-accent text-primary rounded-lg flex items-center justify-center">
                                        <Layers size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground leading-none">{collectionData.collection}</h2>
                                        <p className="text-xs text-muted-foreground mt-1">{collectionData.total} documents found</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => selectCollection(selectedCollection, currentPage)}
                                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">#</th>
                                            {collectionData.columns?.slice(0, 6).map(c => (
                                                <th key={c.name} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    <div className="flex flex-col">
                                                        <span>{c.name}</span>
                                                        <span className={`text-[9px] lowercase font-normal normal-case ${getFieldTypeInfo(c.type).color}`}>
                                                            {getFieldTypeInfo(c.type).label}
                                                        </span>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {collectionData.data.map((doc, idx) => (
                                            <tr key={idx} className="border-t border-border hover:bg-muted transition-colors group">
                                                <td className="px-4 py-3 text-xs font-mono text-muted-foreground tabular-nums">
                                                    {(currentPage - 1) * 12 + idx + 1}
                                                </td>
                                                {collectionData.columns?.slice(0, 6).map(col => (
                                                    <td key={col.name} className="px-4 py-3 text-sm truncate max-w-[180px]">
                                                        {renderValue(doc[col.name])}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => viewDocument(doc)}
                                                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                                                            title="View JSON"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteDocument(doc._id || doc.id)}
                                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Delete record"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {collectionData.total_pages > 1 && (
                                <div className="px-5 py-4 border-t border-border flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground font-medium tabular-nums">Record {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, collectionData.total)}</p>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => selectCollection(selectedCollection, currentPage - 1)}
                                            disabled={currentPage <= 1}
                                            className="p-1.5 border border-border rounded-lg bg-card disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <div className="flex gap-1 px-2">
                                            {[...Array(Math.min(collectionData.total_pages, 5))].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => selectCollection(selectedCollection, i + 1)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-semibold tabular-nums transition-colors ${currentPage === i + 1 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => selectCollection(selectedCollection, currentPage + 1)}
                                            disabled={currentPage >= collectionData.total_pages}
                                            className="p-1.5 border border-border rounded-lg bg-card disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Logical & Clear Data Modal */}
            {showDetail && detailDoc && (
                <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="pp-card rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden p-0">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-border flex items-center justify-between sticky top-0 z-10 bg-card">
                            <div className="flex items-center gap-3">
                                <div className="bg-accent text-primary p-2 rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground leading-none">Record Inspector</h3>
                                    <p className="text-xs text-muted-foreground mt-1 uppercase font-semibold tracking-wider">
                                        ID: {detailDoc.document._id || detailDoc.document.id || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetail(false)}
                                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto flex-1 p-0 custom-scrollbar bg-background/40">
                            <div className="p-6 space-y-6">
                                {/* Key Value Properties */}
                                <section className="pp-card p-5">
                                    <div className="flex items-center gap-2 mb-5 border-b border-border pb-3">
                                        <Hash size={14} className="text-muted-foreground" />
                                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Document Schema</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-y-4">
                                        {Object.entries(detailDoc.document).map(([key, value]) => (
                                            <div key={key} className="flex flex-col sm:flex-row sm:items-start border-b border-border pb-3 last:border-0 last:pb-0">
                                                <div className="sm:w-1/3 mb-1 sm:mb-0">
                                                    <span className="text-xs font-mono font-semibold text-muted-foreground">{key}</span>
                                                </div>
                                                <div className="sm:w-2/3">
                                                    {typeof value === 'object' ? (
                                                        <div className="bg-muted rounded-lg font-mono text-xs p-3 overflow-x-auto">
                                                            <pre className="text-muted-foreground whitespace-pre-wrap">
                                                                {JSON.stringify(value, null, 2)}
                                                            </pre>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-mono text-foreground break-all">{String(value)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* RAG Logic Visibility (If exists) */}
                                {detailDoc.rag_data && (
                                    <section className="pp-card p-5 border-l-4 border-l-primary">
                                        <div className="flex items-center gap-2 mb-5 border-b border-border pb-3">
                                            <Zap size={14} className="text-primary" />
                                            <h4 className="text-[11px] font-semibold text-primary uppercase tracking-widest">Retrieval Pipeline Data</h4>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Subsections: Chunks & Scores */}
                                            {detailDoc.rag_data.chunks && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Retrieved Context Blocks</p>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {detailDoc.rag_data.chunks.map((c, i) => (
                                                            <div key={i} className="bg-muted rounded-lg p-3 text-xs text-muted-foreground leading-relaxed italic">
                                                                "{c.text}"
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {detailDoc.rag_data.rag_chunk_scores && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Semantic Confidence Scores</p>
                                                    <div className="bg-muted rounded-lg p-5">
                                                        {detailDoc.rag_data.rag_chunk_scores.map((s, i) => (
                                                            <div key={i} className="mb-4 last:mb-0">
                                                                <div className="flex justify-between mb-1">
                                                                    <span className="text-[9px] font-mono font-semibold text-muted-foreground">VECTOR_{s.index}</span>
                                                                    <span className="text-[10px] font-mono font-semibold text-primary tabular-nums">{(s.similarity * 100).toFixed(2)}%</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${s.similarity * 100}%` }}></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                            <button
                                onClick={() => setShowDetail(false)}
                                className="bg-primary text-primary-foreground hover:opacity-90 rounded-lg px-4 py-2 font-medium text-sm transition-opacity"
                            >
                                Close Inspector
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatabaseExplorer;
