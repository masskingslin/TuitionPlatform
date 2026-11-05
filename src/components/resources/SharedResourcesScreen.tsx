import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { EducationalResource, ResourceType } from '../../types';
import { ResourcePreviewModal } from './ResourcePreviewModal';
import { FileUploadInput } from '../common/FileUploadInput';
import { downloadFile } from '../../services/storageService';
import {
  FileText,
  ExternalLink,
  Video,
  FileSpreadsheet,
  Plus,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  Calendar,
  User,
  Eye,
  Tag
} from 'lucide-react';

interface SharedResourcesScreenProps {
  isTeacher?: boolean;
}

export const SharedResourcesScreen: React.FC<SharedResourcesScreenProps> = ({ isTeacher = false }) => {
  const { resources, addResource, deleteResource, batches, currentTeacher } = useTuition();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewResource, setPreviewResource] = useState<EducationalResource | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Teacher upload
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newType, setNewType] = useState<ResourceType>('PDF');
  const [newBatchId, setNewBatchId] = useState('ALL');
  const [newUrlOrFilename, setNewUrlOrFilename] = useState('');
  const [newFileUrl, setNewFileUrl] = useState<string | undefined>(undefined);
  const [newFileName, setNewFileName] = useState<string | undefined>(undefined);
  const [newDescription, setNewDescription] = useState('');
  const [newSizeOrDuration, setNewSizeOrDuration] = useState('2.5 MB · PDF');
  const [newTags, setNewTags] = useState('Chapter 4, Revision');

  const filteredResources = resources.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = subjectFilter === 'ALL' || item.subject === subjectFilter;
    const matchesType = typeFilter === 'ALL' || item.type === typeFilter;

    return matchesSearch && matchesSubject && matchesType;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrlOrFilename.trim()) return;

    const targetBatch = batches.find((b) => b.id === newBatchId);
    const batchTitle = newBatchId === 'ALL' ? 'All Batches' : targetBatch ? targetBatch.title : 'General Batch';

    addResource({
      batchId: newBatchId,
      batchTitle,
      title: newTitle.trim(),
      subject: newSubject,
      type: newType,
      urlOrFilename: newUrlOrFilename.trim(),
      fileUrl: newFileUrl,
      fileName: newFileName || newUrlOrFilename.trim(),
      description: newDescription.trim() || 'Reference educational study material provided by faculty.',
      authorName: currentTeacher.name,
      fileSizeOrDuration: newSizeOrDuration.trim() || 'Document',
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    });

    setNewTitle('');
    setNewUrlOrFilename('');
    setNewFileUrl(undefined);
    setNewFileName(undefined);
    setNewDescription('');
    setShowUploadModal(false);
    setToastMessage('Educational resource published and shared with students successfully!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDelete = (resourceId: string, title: string) => {
    deleteResource(resourceId);
    setToastMessage(`Removed "${title}" from shared materials.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadAction = (res: EducationalResource) => {
    if (res.fileUrl) {
      downloadFile(res.fileUrl, res.fileName || res.urlOrFilename);
      setToastMessage(`Downloading "${res.title}"...`);
    } else {
      setToastMessage(`Downloading "${res.title}" (${res.urlOrFilename})...`);
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-4 h-4 text-rose-600" />;
      case 'VIDEO':
        return <Video className="w-4 h-4 text-purple-600" />;
      case 'LINK':
        return <ExternalLink className="w-4 h-4 text-blue-600" />;
      case 'CHEATSHEET':
        return <FileSpreadsheet className="w-4 h-4 text-amber-600" />;
    }
  };

  const getTypeBadgeClass = (type: ResourceType) => {
    switch (type) {
      case 'PDF':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'VIDEO':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'LINK':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'CHEATSHEET':
        return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Hero Header */}
      <div
        className={`rounded-2xl p-6 text-white shadow-md relative overflow-hidden ${
          isTeacher
            ? 'bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800'
            : 'bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold block">
              Digital Learning Repository
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Shared Educational Resources & Notes</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/80 font-medium">
              <span>{resources.length} Available Learning Materials</span>
              <span aria-hidden="true">·</span>
              <span>Formula Sheets, Web Links, Video Tutorials & Cheatsheets</span>
            </div>
          </div>

          {isTeacher && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 bg-white text-teal-900 hover:bg-teal-50 active:bg-teal-100 text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 self-start md:self-center"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span>Upload / Share Material</span>
            </button>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by topic, chapter title, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs text-slate-500 font-medium">Subject:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
            </select>
          </div>
        </div>

        {/* Resource Type Segmented Buttons */}
        <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-slate-100">
          {[
            { id: 'ALL', label: 'All Resources' },
            { id: 'PDF', label: 'PDF Handouts' },
            { id: 'LINK', label: 'Web Links & Portals' },
            { id: 'VIDEO', label: 'Video Lectures' },
            { id: 'CHEATSHEET', label: 'Formula Cheatsheets' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors font-medium ${
                typeFilter === type.id
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="space-y-3.5">
        {filteredResources.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
            No educational materials match your search or filter.
          </div>
        ) : (
          filteredResources.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      {getTypeIcon(res.type)}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{res.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTypeBadgeClass(res.type)}`}>
                      {res.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                    <span className="font-semibold text-slate-700">{res.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {res.authorName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Uploaded {res.uploadedAt}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Target: {res.batchTitle || 'All Batches'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    onClick={() => setPreviewResource(res)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Material</span>
                  </button>

                  <button
                    onClick={() => handleDownloadAction(res)}
                    className="p-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Download / Save reference"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {isTeacher && (
                    <button
                      onClick={() => handleDelete(res.id, res.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                {res.description}
              </p>

              {/* Metadata strip: filename/URL and tags */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400">Reference:</span>
                  <span className="text-slate-700 font-semibold truncate max-w-sm">{res.urlOrFilename}</span>
                  {res.fileSizeOrDuration && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-500">{res.fileSizeOrDuration}</span>
                    </>
                  )}
                </div>

                {res.tags && res.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-500">{res.tags.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Teacher Upload Material Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                  Faculty Publishing Desk
                </span>
                <h3 className="text-lg font-bold text-slate-900">Upload & Share Educational Material</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="General Science">General Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Material Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ResourceType)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="PDF">PDF Handout / Document</option>
                    <option value="LINK">External Web Portal / Link</option>
                    <option value="VIDEO">Video Lecture URL</option>
                    <option value="CHEATSHEET">Formula Cheatsheet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Batch</label>
                <select
                  value={newBatchId}
                  onChange={(e) => setNewBatchId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                >
                  <option value="ALL">All Enrolled Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title of Resource</label>
                <input
                  type="text"
                  placeholder="e.g., Quadratic Equations Complete Solved Examples Booklet"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium"
                />
              </div>

              {newType === 'PDF' || newType === 'CHEATSHEET' ? (
                <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/90 space-y-2">
                  <FileUploadInput
                    label="Upload Real Resource File (PDF or Image, max 10 MB)"
                    folder="resources"
                    currentFileName={newUrlOrFilename}
                    currentFileSize={newSizeOrDuration}
                    currentFileUrl={newFileUrl}
                    onFileUploaded={(res) => {
                      setNewUrlOrFilename(res.fileName);
                      setNewFileName(res.fileName);
                      setNewFileUrl(res.downloadUrl);
                      setNewSizeOrDuration(`${res.fileSizeFormatted} · Document`);
                      if (!newTitle.trim()) {
                        setNewTitle(res.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
                      }
                    }}
                    accentColor="teal"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Web URL Link
                  </label>
                  <input
                    type="text"
                    placeholder={
                      newType === 'VIDEO'
                        ? 'https://www.youtube.com/watch?v=example'
                        : 'https://example.com/reference-portal'
                    }
                    value={newUrlOrFilename}
                    onChange={(e) => setNewUrlOrFilename(e.target.value)}
                    required
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Size or Duration</label>
                  <input
                    type="text"
                    placeholder="e.g., 3.2 MB · 10 pages or 22 mins"
                    value={newSizeOrDuration}
                    onChange={(e) => setNewSizeOrDuration(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g., Formulas, Derivations, Unit 3"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  placeholder="Outline key concepts, required reading sections, or exam preparation advice for students..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish to Students</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Interactive Resource Preview Modal */}
      <ResourcePreviewModal
        resource={previewResource}
        onClose={() => setPreviewResource(null)}
        isTeacher={isTeacher}
      />
    </div>
  );
};
