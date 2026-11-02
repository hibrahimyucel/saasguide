export {};

declare global {
  interface Window {
    /**
     * Modern File System Access API - Klasör seçici penceresini açar
     */
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite';
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }): Promise<FileSystemDirectoryHandle>;
  }
}
