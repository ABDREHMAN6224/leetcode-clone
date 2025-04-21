import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ProblemType } from "@/types";

const ProblemCard = ({problem}: {problem: ProblemType}) => {
  const {title, description, difficulty} = problem

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-500"
      case "MEDIUM":
        return "bg-yellow-500"
      case "HARD":
        return "bg-red-500"
      default:
        return ""
    }
  }

  return (
    <Link href={`/problems/${problem.id}`} className="w-full">
      <Card className="w-full flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-2xl">{title}</p>
          {difficulty && <p className={`text-xs p-1 rounded-lg px-2 text-white font-bold ${getDifficultyColor(difficulty)}`}>{difficulty}</p>}
        </div>
        <p className="text-secondary-foreground">{description}</p>
      </Card>
    </Link>
  )
}

export default async function Home() {

  const { problems } = (await (await fetch("http://backend:3000/api/problems")).json()).data

  return (
    <div className="flex flex-col items-center justify-center gap-2 min-h-screen p-8">
      <h1 className="text-4xl font-bold">Problems</h1>
      <div className="flex w-full flex-col gap-2">
        {problems.map((problem: ProblemType) => (
          <ProblemCard key={problem.id} problem={problem} />
        ))}
      </div>
    </div>
  );
}
