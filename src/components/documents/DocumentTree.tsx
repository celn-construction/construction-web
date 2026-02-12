'use client';

import { FileText, Folder } from 'lucide-react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Paper, Box } from '@mui/material';

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
  // Get all node IDs to expand by default
  const defaultExpandedItems = [
    ...documentData.map((project) => project.id),
    ...documentData.flatMap((project) => project.folders.map((folder) => folder.id)),
  ];

  return (
    <Paper
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        p: 2,
      }}
    >
      <SimpleTreeView defaultExpandedItems={defaultExpandedItems}>
        {documentData.map((project) => (
          <TreeItem
            key={project.id}
            itemId={project.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <Folder size={18} />
                <Box sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {project.name}
                </Box>
              </Box>
            }
          >
            {project.folders.map((folder) => (
              <TreeItem
                key={folder.id}
                itemId={folder.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                    <Folder size={16} style={{ color: '#3b82f6' }} />
                    <Box sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {folder.name}
                    </Box>
                  </Box>
                }
              >
                {folder.documents.map((doc) => (
                  <TreeItem
                    key={doc.id}
                    itemId={doc.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                        <FileText size={14} style={{ color: '#6b7280' }} />
                        <Box sx={{ color: 'text.secondary' }}>{doc.name}</Box>
                      </Box>
                    }
                  />
                ))}
              </TreeItem>
            ))}
          </TreeItem>
        ))}
      </SimpleTreeView>
    </Paper>
  );
}
