declare module "react-organizational-chart" {
  import { ReactNode, ComponentType } from "react";

  interface TreeProps {
    label: ReactNode;
    lineWidth?: string;
    lineColor?: string;
    lineBorderRadius?: string;
    lineHeight?: string;
    lineStyle?: "solid" | "dashed" | "dotted";
    nodePadding?: string;
    children?: ReactNode;
  }

  interface TreeNodeProps {
    label: ReactNode;
    children?: ReactNode;
  }

  export const Tree: ComponentType<TreeProps>;
  export const TreeNode: ComponentType<TreeNodeProps>;
}
