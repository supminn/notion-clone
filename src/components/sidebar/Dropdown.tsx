import React from "react";

interface DropdownProps {
  title: string;
  id: string;
  listType: "folder" | "file";
  iconId: string;
  children?: React.ReactNode;
  disabled?: boolean;
  customIcon?: React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({
  title,
  id,
  listType,
  iconId,
  children,
  disabled,
  customIcon,
}) => {
  // Folder title synced with server and local data
  // File title
  // Function to navigate the user to a different page
  // Add a new file into this folder
  // Edit the folder using double click
  // Blur the dropdown when the user clicks outside. This would also save the changes
  // onChanges
  // move to trash when the user deletes the folder

  return <div>Dropdown</div>;
};

export default Dropdown;
