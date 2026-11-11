interface PillarItemProps {
  body: string
  title: string
}

export function PillarItem({ body, title }: PillarItemProps) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{body}</p>
    </div>
  )
}
