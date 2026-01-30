import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'ابدأ الكتابة هنا...',
  height = 400,
  disabled = false
}) => {
  const editorRef = useRef(null);

  const handleEditorChange = (content) => {
    onChange(content);
  };

  return (
    <div className="rich-text-editor">
      <Editor
        apiKey="bknl1bgsjr6i7ghdqph06otrlwt026yxa6zpee0d7epl9wdg"
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={handleEditorChange}
        disabled={disabled}
        init={{
          height,
          menubar: true,
          directionality: 'rtl',
          placeholder,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount', 'directionality'
          ],
          toolbar:
            'undo redo | blocks | ' +
            'bold italic forecolor backcolor | alignright aligncenter alignleft alignjustify | ' +
            'bullist numlist outdent indent | ' +
            'link image media | ltr rtl | ' +
            'removeformat | help',
          content_style: `
            body {
              font-family: 'Readex Pro', 'Segoe UI', Tahoma, sans-serif;
              font-size: 16px;
              direction: rtl;
              text-align: right;
              padding: 12px;
              line-height: 1.8;
            }
            p { margin: 0 0 1em 0; }
            img { max-width: 100%; height: auto; }
          `,
          content_langs: [
            { title: 'Arabic', code: 'ar' },
            { title: 'English', code: 'en' }
          ],
          images_upload_handler: async (blobInfo) => {
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve(reader.result);
              };
              reader.readAsDataURL(blobInfo.blob());
            });
          },
          paste_data_images: true,
          link_default_target: '_blank',
          link_assume_external_targets: true,
          table_responsive_width: true,
          skin: 'oxide',
          content_css: 'default',
          autoresize_bottom_margin: 20,
          branding: false,
          promotion: false,
          statusbar: true,
          elementpath: false,
        }}
      />
    </div>
  );
};

export default RichTextEditor;
