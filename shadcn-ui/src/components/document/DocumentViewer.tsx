import React from 'react';
import { FileText, Table, FileImage, FileCode, Film, FileAudio, PresentationIcon } from 'lucide-react';
import { Document } from '@/types/document';

interface DocumentViewerProps {
  document: Document;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document }) => {
  // Determine the appropriate viewer based on file type
  const renderViewer = () => {
    const fileType = document.type.toLowerCase();
    
    // PDF Viewer
    if (fileType === 'pdf') {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-md border-muted p-8">
          <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">PDF Viewer</h3>
          <p className="text-muted-foreground mt-2 max-w-md text-center">
            This is a PDF document. In a production environment, this would display an embedded PDF viewer.
          </p>
          <div className="mt-4 flex flex-col gap-2 w-full max-w-sm">
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Text search</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Content extraction</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Annotations</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Excel/Spreadsheet Viewer
    else if (fileType === 'xls' || fileType === 'xlsx' || fileType === 'csv') {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-md border-muted p-8">
          <Table className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Spreadsheet Viewer</h3>
          <p className="text-muted-foreground mt-2 max-w-md text-center">
            This is a {fileType.toUpperCase()} spreadsheet. In a production environment, this would display a data grid viewer.
          </p>
          <div className="mt-4 flex flex-col gap-2 w-full max-w-sm">
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Data filtering</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Formula execution</span>
              <span className="font-medium text-yellow-600">Limited</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Data export</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Word/Document Viewer
    else if (fileType === 'doc' || fileType === 'docx' || fileType === 'rtf' || fileType === 'txt') {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-md border-muted p-8">
          <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Document Viewer</h3>
          <p className="text-muted-foreground mt-2 max-w-md text-center">
            This is a {fileType.toUpperCase()} text document. In a production environment, this would display a document viewer.
          </p>
          <div className="mt-4 flex flex-col gap-2 w-full max-w-sm">
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Text search</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Formatting preservation</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Track changes</span>
              <span className="font-medium text-yellow-600">Limited</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Presentation Viewer
    else if (fileType === 'ppt' || fileType === 'pptx') {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-md border-muted p-8">
          <PresentationIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Presentation Viewer</h3>
          <p className="text-muted-foreground mt-2 max-w-md text-center">
            This is a {fileType.toUpperCase()} presentation. In a production environment, this would display a slide viewer.
          </p>
          <div className="mt-4 flex flex-col gap-2 w-full max-w-sm">
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Slide navigation</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Presenter notes</span>
              <span className="font-medium text-yellow-600">Limited</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Animations</span>
              <span className="font-medium text-red-600">Not available</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Image Viewer
    else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileType)) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-md border-muted p-8">
          <FileImage className="h-16 w-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Image Viewer</h3>
          <p className="text-muted-foreground mt-2 max-w-md text-center">
            This is a {fileType.toUpperCase()} image. In a production environment, this would display an image viewer.
          </p>
          <div className="mt-4 flex flex-col gap-2 w-full max-w-sm">
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Zoom & pan</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>EXIF data</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Image editing</span>
              <span className="font-medium text-red-600">Not available</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Code/Syntax Highlighting Viewer
    else if (['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'cs', 'php'].includes(fileType)) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-md border-muted p-8">
          <FileCode className="h-16 w-16 text-teal-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Code Viewer</h3>
          <p className="text-muted-foreground mt-2 max-w-md text-center">
            This is a {fileType.toUpperCase()} code file. In a production environment, this would display a syntax highlighting code viewer.
          </p>
          <div className="mt-4 flex flex-col gap-2 w-full max-w-sm">
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Syntax highlighting</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Line numbers</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Code execution</span>
              <span className="font-medium text-red-600">Not available</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Video Viewer
    else if (['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(fileType)) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-md border-muted p-8">
          <Film className="h-16 w-16 text-cyan-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Video Viewer</h3>
          <p className="text-muted-foreground mt-2 max-w-md text-center">
            This is a {fileType.toUpperCase()} video file. In a production environment, this would display a video player.
          </p>
          <div className="mt-4 flex flex-col gap-2 w-full max-w-sm">
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Playback controls</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Resolution selection</span>
              <span className="font-medium text-yellow-600">Limited</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Caption support</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Audio Viewer
    else if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(fileType)) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-md border-muted p-8">
          <FileAudio className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Audio Player</h3>
          <p className="text-muted-foreground mt-2 max-w-md text-center">
            This is a {fileType.toUpperCase()} audio file. In a production environment, this would display an audio player.
          </p>
          <div className="mt-4 flex flex-col gap-2 w-full max-w-sm">
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Playback controls</span>
              <span className="font-medium text-green-600">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Waveform visualization</span>
              <span className="font-medium text-yellow-600">Limited</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Equalizer</span>
              <span className="font-medium text-red-600">Not available</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Default/Generic Viewer
    else {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-md border-muted p-8">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Document Preview</h3>
          <p className="text-muted-foreground mt-2 max-w-md text-center">
            This is a {document.type.toUpperCase()} file. In a production environment, we would attempt to display a preview if supported.
          </p>
          <div className="mt-4 flex flex-col gap-2 w-full max-w-sm">
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Preview support</span>
              <span className="font-medium text-yellow-600">Limited</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
              <span>Content extraction</span>
              <span className="font-medium text-yellow-600">Limited</span>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div>
      {renderViewer()}
      {document.electronAppCompatible && (
        <div className="mt-4 bg-blue-50 p-3 rounded-md text-blue-700 text-sm">
          <p className="font-medium">Desktop App Compatible</p>
          <p className="text-xs mt-1">This document can be opened in the desktop application</p>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;