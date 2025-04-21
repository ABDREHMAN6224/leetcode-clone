import { Card } from "@/components/ui/card";
import { ProblemType } from "@/types";

const ProblemCard = ({problem}: {problem: ProblemType}) => {
  const {title} = problem
  return (
    <Card className="w-full flex flex-col gap-2">
      <p className="font-bold text-2xl">{title}</p>
    </Card>
  )
}

export default async function Home() {

  const { problems } = (await (await fetch("http://backend:3000/api/problems")).json()).data

  return (
    <div className="flex flex-col items-center justify-center gap-2 min-h-screen p-24">
      <h1 className="text-4xl font-bold">Problems</h1>
      <div className="flex flex-col gap-2">
        {problems.map((problem: ProblemType) => (
          <ProblemCard key={problem.title} problem={problem} />
        ))}
      </div>
    </div>
  );
}
