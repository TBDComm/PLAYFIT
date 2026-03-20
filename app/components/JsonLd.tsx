interface JsonLdProps {
  data: Record<string, unknown>
}

// Generic JSON-LD renderer — safe against script injection via <\/ escaping
export default function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/<\//g, '<\\/')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
