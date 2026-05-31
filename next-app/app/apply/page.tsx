// Public talent application (#15) — anonymous, no auth gate. The interactive
// multi-step form is the client component IntakeFlow, which submits anonymously
// via submitIntakeAction (anon insert, status='applied', is_demo=false).
import IntakeFlow from "@/components/talent/IntakeFlow";

export default function ApplyPage() {
  return <IntakeFlow />;
}
