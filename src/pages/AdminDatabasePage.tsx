import React, { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, Search, Layers, CheckCircle2, Copy, Check, Table, Code } from 'lucide-react';
import { api, type DatabaseStatus } from '../services/api';

interface CollectionStat {
  name: string;
  count: number;
}

export default function AdminDatabasePage() {
  const [overview, setOverview] = useState<{ status: DatabaseStatus; collections: CollectionStat[] } | null>(null);
  const [selectedCol, setSelectedCol] = useState<string>('users');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [docsLoading, setDocsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDatabaseOverview();
      setOverview(res);
      if (res.collections.length > 0) {
        setSelectedCol(prev => prev || res.collections[0].name);
      }
    } catch (err) {
      console.error('Failed to load DB overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCollectionDocs = async (colName: string) => {
    setDocsLoading(true);
    try {
      const res = await api.getDatabaseCollection(colName);
      setDocuments(res.documents || []);
    } catch (err) {
      console.error(`Failed to fetch documents for ${colName}:`, err);
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (selectedCol) {
      fetchCollectionDocs(selectedCol);
    }
  }, [selectedCol]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredDocs = documents.filter(doc => {
    if (!search.trim()) return true;
    const str = JSON.stringify(doc).toLowerCase();
    return str.includes(search.toLowerCase());
  });

  return (
    <div className="page-enter" style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Database Explorer</h1>
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: 'var(--purple)', fontWeight: 600 }}>
              MongoDB Live Studio
            </span>
          </div>
          <p style={{ margin: '6px 0 0', color: 'var(--text2)', fontSize: 14 }}>
            Explore collections and documents in real time directly from your browser.
          </p>
        </div>

        <button
          onClick={() => {
            fetchOverview();
            fetchCollectionDocs(selectedCol);
          }}
          className="btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 14 }}
        >
          <RefreshCw size={16} className={loading || docsLoading ? 'spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Database Connection Banner */}
      <div className="panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={24} color="var(--green)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {overview?.status?.connected ? 'MongoDB Server' : 'Local Persistent Storage'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)', fontSize: 12, fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Live
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2, fontFamily: 'monospace' }}>
              {overview?.status?.connected ? 'mongodb://127.0.0.1:27017/finsight' : (overview?.status?.storageFile || 'server/data/finsight_db.json')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Collections</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--purple)', marginTop: 2 }}>
              {overview?.collections?.length || 4}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Documents</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', marginTop: 2 }}>
              {overview?.collections?.reduce((sum, c) => sum + c.count, 0) || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Collection Tabs */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {(overview?.collections || [
          { name: 'users', count: 0 },
          { name: 'transactions', count: 0 },
          { name: 'goals', count: 0 },
          { name: 'assets', count: 0 },
        ]).map(col => {
          const isActive = selectedCol === col.name;
          return (
            <button
              key={col.name}
              onClick={() => setSelectedCol(col.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 20px',
                borderRadius: 12,
                border: isActive ? '1.5px solid var(--purple)' : '1px solid var(--border)',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'var(--surface)',
                color: isActive ? 'var(--text)' : 'var(--text2)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Layers size={16} color={isActive ? 'var(--purple)' : 'var(--text3)'} />
              <span style={{ textTransform: 'capitalize' }}>{col.name}</span>
              <span style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 10,
                background: isActive ? 'var(--purple)' : 'var(--bg3)',
                color: isActive ? '#fff' : 'var(--text2)',
                fontWeight: 600,
              }}>
                {col.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explorer Panel */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Search and view toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', width: 320 }}>
            <Search size={16} color="var(--text3)" />
            <input
              type="text"
              placeholder={`Filter documents in ${selectedCol}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', width: '100%', fontSize: 13, fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: viewMode === 'table' ? 'var(--surface)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--text)' : 'var(--text3)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Table size={14} /> Table
              </button>
              <button
                onClick={() => setViewMode('json')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: viewMode === 'json' ? 'var(--surface)' : 'transparent',
                  color: viewMode === 'json' ? 'var(--text)' : 'var(--text3)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Code size={14} /> JSON Documents
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {docsLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--purple)' }} />
            Loading documents from MongoDB...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
            No documents found in collection <code>{selectedCol}</code>
          </div>
        ) : viewMode === 'table' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(129,140,248,0.06)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 20px', color: 'var(--text2)', fontWeight: 600 }}>ID / Document Key</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text2)', fontWeight: 600 }}>Primary Field</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text2)', fontWeight: 600 }}>Values</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text2)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc, i) => {
                  const docId = doc.id || doc._id || `doc_${i}`;
                  const primaryText = doc.email || doc.description || doc.name || doc.symbol || 'Document';
                  const summaryFields = Object.entries(doc)
                    .filter(([k]) => !['id', '_id', '__v', 'passwordHash'].includes(k))
                    .slice(0, 4);

                  return (
                    <tr key={docId} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: 'var(--text2)', fontSize: 12 }}>
                        {docId}
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text)' }}>
                        {primaryText}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {summaryFields.map(([k, v]) => (
                            <span key={k} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'var(--bg2)', color: 'var(--text2)' }}>
                              <strong style={{ color: 'var(--text3)' }}>{k}:</strong> {typeof v === 'object' ? (Array.isArray(v) ? `[${v.length}]` : '{...}') : String(v)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(doc, null, 2), docId)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: copiedId === docId ? 'var(--green)' : 'var(--text2)',
                            cursor: 'pointer',
                            fontSize: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {copiedId === docId ? <Check size={13} /> : <Copy size={13} />}
                          {copiedId === docId ? 'Copied' : 'Copy JSON'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredDocs.map((doc, i) => {
              const docId = doc.id || doc._id || `doc_${i}`;
              return (
                <div
                  key={docId}
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 18,
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--purple)', fontWeight: 600 }}>
                      _id: {docId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(doc, null, 2), docId)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: copiedId === docId ? 'var(--green)' : 'var(--text2)',
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {copiedId === docId ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === docId ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: 'Consolas, monospace',
                      fontSize: 12.5,
                      color: 'var(--text)',
                      overflowX: 'auto',
                      lineHeight: 1.5,
                    }}
                  >
                    {JSON.stringify(doc, null, 2)}
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
