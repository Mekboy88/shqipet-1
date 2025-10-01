
import React from "react";

interface CreatePostTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  userName: string;
}

const CreatePostTextArea: React.FC<CreatePostTextAreaProps> = ({
  value,
  onChange,
  userName
}) => {
  return (
    <textarea 
      className="w-full min-h-[150px] resize-none text-xl border-0 focus:ring-0 focus:outline-none p-0"
      placeholder={`What's on your mind, ${userName}?`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default CreatePostTextArea;
