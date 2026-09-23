import TeacherContentPage from "@/components/teacher/TeacherContentPage";

export default function TeacherHomework() {
  return (
    <TeacherContentPage
      type="homework"
      title="Homework"
      icon="??"
      description="Give homework to your entire class."
      showDueDate
    />
  );
}
