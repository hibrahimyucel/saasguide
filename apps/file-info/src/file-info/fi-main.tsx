import React, { useState } from "react";
import { FiHeader } from "./fi-header";
import { useView } from "./context/fi-menu-provider";
import { FileInfoManager } from "./fi-editor";
import { FileInfoViewer } from "./fi-viewer";

export default function FiMain() {
  const { activeView } = useView();
  return (
    <>
      <FiHeader />
      <div className="panel-module">
        {activeView === "explorer" && <FileInfoViewer />}
        {activeView === "editor" && <FileInfoManager />}
      </div>
    </>
  );
}
