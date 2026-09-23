import TeacherContentPage from "@/components/teacher/TeacherContentPage";

export default function TeacherAssignments() {
  return (
    <TeacherContentPage
      type="assignment"
      title="Assignments"
      icon=""
      description="Create and share assignments with your entire class."
      showDueDate
    />
  );
}
