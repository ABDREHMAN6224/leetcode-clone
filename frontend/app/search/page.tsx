"use client"

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ArticleType = {
  id: string,
  category: string[],
  title: string[],
  published: boolean[],
  author: string[],
}

const Article = ({article}: {article: ArticleType}) => {
  const { id, category, author, published, title } = article

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg">
      <div className="flex justify-between items-center">
        <p className="text-2xl font-bold">{title[0]}</p>
        <p className={`text-sm ${published[0] ? "bg-green-500" : "bg-red-600"} rounded-md p-1 px-2 font-bold text-white`}>{published[0] ? "Published" : "Not Published"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {category.map((c, index) => (
          <p key={index} className="text-xs font-medium text-white bg-yellow-600 rounded-md px-2 p-1">{c}</p>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {author.map((a, index) => (
          <p key={index} className="text-secondary-foreground">{a}</p>
        ))}
      </div>
    </div>
  )
}

export default function Search() {

  const [query, setQuery] = useState<string>("")

  const [articles, setArticles] = useState<ArticleType[]>([])

  useEffect(() => {
    const fetchArticles = async () => {
      const { articles } = await (await fetch("/api/search", {
        method: "POST",
        body: JSON.stringify({ query: "*:*" }),
      })).json()
      setArticles(articles)
    }

    fetchArticles()
  }, []) 

  const updateArticles = async (query: string) => {
    const { articles } = await (await fetch("/api/search", {
      method: "POST",
      body: JSON.stringify({ query }),
    })).json()
    setArticles(articles)
  }

  return (
    <div className="flex flex-col items-center gap-2 min-h-screen p-8">
      <h1 className="text-4xl font-bold">Search Solr</h1>
      <div className="flex gap-2 items-center">
        <Input placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-96" />
        <Button onClick={() => updateArticles(query)} variant="outline" size={"icon"} className="p-2">
          <svg className="size-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21l-4.3-4.3"/></g></svg>
        </Button>
      </div>
      <div className="flex flex-col gap-2 w-full">
        {articles.map((article: ArticleType) => (
          <Article key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}