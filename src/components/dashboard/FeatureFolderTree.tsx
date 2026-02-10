'use client';

import { useState } from 'react';
import { FileText, Folder } from 'lucide-react';
import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeNodeContent,
  TreeExpander,
  TreeIcon,
  TreeLabel,
} from '@/components/kibo-ui/tree';
import { ImageDropzone } from '@/components/ui/image-dropzone';

// Static construction document folder structure (same for every feature)
const folderData = [
  {
    id: 'rfi',
    name: 'RFI',
    isLeaf: true,
  },
  {
    id: 'submittals',
    name: 'Submittals',
    isLeaf: false,
    children: [
      { id: 'submittals-product', name: 'Product Data' },
      { id: 'submittals-shop', name: 'Shop Drawings' },
      { id: 'submittals-certs', name: 'Certs' },
    ],
  },
  {
    id: 'change-orders',
    name: 'Change Orders',
    isLeaf: true,
  },
  {
    id: 'photos',
    name: 'Photos',
    isLeaf: true,
  },
  {
    id: 'inspections',
    name: 'Inspections',
    isLeaf: false,
    children: [
      { id: 'inspections-structural', name: 'Structural' },
      { id: 'inspections-mep', name: 'MEP' },
      { id: 'inspections-safety', name: 'Safety' },
    ],
  },
];

type FeatureFolderTreeProps = {
  featureName: string;
  featureId: string;
  coverImage?: string;
  onCoverImageChange: (imageUrl: string | undefined) => void;
  onDocumentSelect?: (docId: string, docName: string) => void;
};

export default function FeatureFolderTree({
  featureName,
  featureId,
  coverImage,
  onCoverImageChange,
  onDocumentSelect
}: FeatureFolderTreeProps) {
  // Collect all child node IDs and create lookup map
  const childNodes = new Set<string>();
  const childNodeNames = new Map<string, string>();

  folderData.forEach((folder) => {
    if (!folder.isLeaf && folder.children) {
      folder.children.forEach((child) => {
        childNodes.add(child.id);
        childNodeNames.set(child.id, child.name);
      });
    }
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectionChange = (newSelectedIds: string[]) => {
    setSelectedIds(newSelectedIds);

    // Check if selected ID is a child node
    const selectedId = newSelectedIds[0];
    if (selectedId && childNodes.has(selectedId) && onDocumentSelect) {
      const docName = childNodeNames.get(selectedId) || selectedId;
      onDocumentSelect(selectedId, docName);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-3 pb-2 border-b border-[var(--border-color)]">
        <h3 className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
          Folders – {featureName}
        </h3>
      </div>

      {/* Cover Photo */}
      <div className="mb-4">
        <ImageDropzone
          value={coverImage}
          onChange={onCoverImageChange}
        />
      </div>

      {/* Tree */}
      <TreeProvider
        showLines={false}
        showIcons={true}
        selectable={true}
        multiSelect={false}
        indent={14}
        animateExpand={true}
        className="w-full"
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
      >
        <TreeView className="p-0">
          {folderData.map((folder, folderIndex) => (
            <TreeNode
              key={folder.id}
              nodeId={folder.id}
              level={0}
              isLast={folderIndex === folderData.length - 1}
            >
              <TreeNodeTrigger>
                <TreeExpander hasChildren={!folder.isLeaf} />
                <TreeIcon
                  hasChildren={!folder.isLeaf}
                  icon={<Folder className="h-4 w-4 text-amber-500" />}
                />
                <TreeLabel className="font-medium text-gray-800 dark:text-[var(--text-primary)]">
                  {folder.name}
                </TreeLabel>
              </TreeNodeTrigger>
              {!folder.isLeaf && folder.children && (
                <TreeNodeContent hasChildren={true}>
                  {folder.children.map((child, childIndex) => (
                    <TreeNode
                      key={child.id}
                      nodeId={child.id}
                      level={1}
                      isLast={childIndex === folder.children!.length - 1}
                      parentPath={[folderIndex === folderData.length - 1]}
                    >
                      <TreeNodeTrigger>
                        <TreeExpander hasChildren={false} />
                        <TreeIcon
                          hasChildren={false}
                          icon={<FileText className="h-4 w-4 text-gray-500 dark:text-[var(--text-secondary)]" />}
                        />
                        <TreeLabel className="text-gray-700 dark:text-[var(--text-secondary)]">
                          {child.name}
                        </TreeLabel>
                      </TreeNodeTrigger>
                    </TreeNode>
                  ))}
                </TreeNodeContent>
              )}
            </TreeNode>
          ))}
        </TreeView>
      </TreeProvider>
    </div>
  );
}
