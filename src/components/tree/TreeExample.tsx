"use client";

import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeNodeContent,
  TreeExpander,
  TreeIcon,
  TreeLabel,
} from "@/components/kibo-ui/tree";

export default function TreeExample() {
  return (
    <TreeProvider defaultExpandedIds={["src", "components", "app"]}>
      <TreeView>
        <TreeNode nodeId="src" level={0}>
          <TreeNodeTrigger>
            <TreeExpander hasChildren />
            <TreeIcon hasChildren />
            <TreeLabel>src/</TreeLabel>
          </TreeNodeTrigger>
          <TreeNodeContent hasChildren>
            <TreeNode nodeId="components" level={1} parentPath={[false]}>
              <TreeNodeTrigger>
                <TreeExpander hasChildren />
                <TreeIcon hasChildren />
                <TreeLabel>components/</TreeLabel>
              </TreeNodeTrigger>
              <TreeNodeContent hasChildren>
                <TreeNode nodeId="ui" level={2} parentPath={[false, false]}>
                  <TreeNodeTrigger>
                    <TreeExpander hasChildren={false} />
                    <TreeIcon hasChildren={false} />
                    <TreeLabel>ui/</TreeLabel>
                  </TreeNodeTrigger>
                </TreeNode>
                <TreeNode
                  nodeId="layout"
                  level={2}
                  isLast
                  parentPath={[false, false]}
                >
                  <TreeNodeTrigger>
                    <TreeExpander hasChildren={false} />
                    <TreeIcon hasChildren={false} />
                    <TreeLabel>layout/</TreeLabel>
                  </TreeNodeTrigger>
                </TreeNode>
              </TreeNodeContent>
            </TreeNode>

            <TreeNode nodeId="lib" level={1} parentPath={[false]}>
              <TreeNodeTrigger>
                <TreeExpander hasChildren />
                <TreeIcon hasChildren />
                <TreeLabel>lib/</TreeLabel>
              </TreeNodeTrigger>
              <TreeNodeContent hasChildren>
                <TreeNode
                  nodeId="utils"
                  level={2}
                  isLast
                  parentPath={[false, false]}
                >
                  <TreeNodeTrigger>
                    <TreeExpander hasChildren={false} />
                    <TreeIcon hasChildren={false} />
                    <TreeLabel>utils.ts</TreeLabel>
                  </TreeNodeTrigger>
                </TreeNode>
              </TreeNodeContent>
            </TreeNode>

            <TreeNode nodeId="app" level={1} isLast parentPath={[false]}>
              <TreeNodeTrigger>
                <TreeExpander hasChildren />
                <TreeIcon hasChildren />
                <TreeLabel>app/</TreeLabel>
              </TreeNodeTrigger>
              <TreeNodeContent hasChildren>
                <TreeNode nodeId="page" level={2} isLast parentPath={[false, true]}>
                  <TreeNodeTrigger>
                    <TreeExpander hasChildren={false} />
                    <TreeIcon hasChildren={false} />
                    <TreeLabel>page.tsx</TreeLabel>
                  </TreeNodeTrigger>
                </TreeNode>
              </TreeNodeContent>
            </TreeNode>
          </TreeNodeContent>
        </TreeNode>
      </TreeView>
    </TreeProvider>
  );
}
