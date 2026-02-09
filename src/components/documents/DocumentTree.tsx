'use client';

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

// Static construction document data organized by project
const documentData = [
  {
    id: 'riverside',
    name: 'Riverside Apartments',
    folders: [
      {
        id: 'riverside-blueprints',
        name: 'Blueprints',
        documents: [
          { id: 'riverside-bp-1', name: 'Floor Plans v2.3.pdf' },
          { id: 'riverside-bp-2', name: 'Electrical Layout.pdf' },
          { id: 'riverside-bp-3', name: 'Plumbing Schematic.pdf' },
        ],
      },
      {
        id: 'riverside-permits',
        name: 'Permits',
        documents: [
          { id: 'riverside-perm-1', name: 'Building Permit #2024-001.pdf' },
          { id: 'riverside-perm-2', name: 'Environmental Clearance.pdf' },
        ],
      },
      {
        id: 'riverside-contracts',
        name: 'Contracts',
        documents: [
          { id: 'riverside-cont-1', name: 'General Contractor Agreement.pdf' },
        ],
      },
      {
        id: 'riverside-changes',
        name: 'Change Orders',
        documents: [
          { id: 'riverside-chg-1', name: 'CO-001 Foundation Revision.pdf' },
        ],
      },
    ],
  },
  {
    id: 'downtown',
    name: 'Downtown Office Tower',
    folders: [
      {
        id: 'downtown-blueprints',
        name: 'Blueprints',
        documents: [
          { id: 'downtown-bp-1', name: 'Structural Engineering Plans.pdf' },
          { id: 'downtown-bp-2', name: 'HVAC System Layout.pdf' },
        ],
      },
      {
        id: 'downtown-permits',
        name: 'Permits',
        documents: [
          { id: 'downtown-perm-1', name: 'Zoning Variance Approval.pdf' },
        ],
      },
      {
        id: 'downtown-rfis',
        name: 'RFIs',
        documents: [
          { id: 'downtown-rfi-1', name: 'RFI-001 Steel Beam Specs.pdf' },
          { id: 'downtown-rfi-2', name: 'RFI-002 Elevator Shaft Dimensions.pdf' },
        ],
      },
    ],
  },
  {
    id: 'harbor',
    name: 'Harbor Bridge Renovation',
    folders: [
      {
        id: 'harbor-blueprints',
        name: 'Blueprints',
        documents: [
          { id: 'harbor-bp-1', name: 'Bridge Deck Cross-Section.pdf' },
        ],
      },
      {
        id: 'harbor-inspections',
        name: 'Inspections',
        documents: [
          { id: 'harbor-insp-1', name: 'Monthly Safety Report - Jan.pdf' },
          { id: 'harbor-insp-2', name: 'Monthly Safety Report - Feb.pdf' },
        ],
      },
      {
        id: 'harbor-permits',
        name: 'Permits',
        documents: [
          { id: 'harbor-perm-1', name: 'DOT Work Zone Permit.pdf' },
        ],
      },
    ],
  },
];

export default function DocumentTree() {
  // Get all project IDs to expand by default
  const defaultExpandedIds = documentData.map((project) => project.id);

  return (
    <TreeProvider
      defaultExpandedIds={defaultExpandedIds}
      showLines={true}
      showIcons={true}
      selectable={true}
      multiSelect={false}
      indent={20}
      animateExpand={true}
      className="w-full"
    >
      <TreeView className="bg-white dark:bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-4">
        {documentData.map((project, projectIndex) => (
          <TreeNode
            key={project.id}
            nodeId={project.id}
            level={0}
            isLast={projectIndex === documentData.length - 1}
          >
            <TreeNodeTrigger>
              <TreeExpander hasChildren={true} />
              <TreeIcon hasChildren={true} />
              <TreeLabel className="font-semibold text-gray-900 dark:text-white">
                {project.name}
              </TreeLabel>
            </TreeNodeTrigger>
            <TreeNodeContent hasChildren={true}>
              {project.folders.map((folder, folderIndex) => (
                <TreeNode
                  key={folder.id}
                  nodeId={folder.id}
                  level={1}
                  isLast={folderIndex === project.folders.length - 1}
                  parentPath={[projectIndex === documentData.length - 1]}
                >
                  <TreeNodeTrigger>
                    <TreeExpander hasChildren={true} />
                    <TreeIcon hasChildren={true} icon={<Folder className="h-4 w-4 text-blue-500" />} />
                    <TreeLabel className="font-medium text-gray-800 dark:text-[var(--text-primary)]">
                      {folder.name}
                    </TreeLabel>
                  </TreeNodeTrigger>
                  <TreeNodeContent hasChildren={true}>
                    {folder.documents.map((doc, docIndex) => (
                      <TreeNode
                        key={doc.id}
                        nodeId={doc.id}
                        level={2}
                        isLast={docIndex === folder.documents.length - 1}
                        parentPath={[
                          projectIndex === documentData.length - 1,
                          folderIndex === project.folders.length - 1,
                        ]}
                      >
                        <TreeNodeTrigger>
                          <TreeExpander hasChildren={false} />
                          <TreeIcon hasChildren={false} icon={<FileText className="h-4 w-4 text-gray-500" />} />
                          <TreeLabel className="text-gray-700 dark:text-[var(--text-secondary)]">
                            {doc.name}
                          </TreeLabel>
                        </TreeNodeTrigger>
                      </TreeNode>
                    ))}
                  </TreeNodeContent>
                </TreeNode>
              ))}
            </TreeNodeContent>
          </TreeNode>
        ))}
      </TreeView>
    </TreeProvider>
  );
}
