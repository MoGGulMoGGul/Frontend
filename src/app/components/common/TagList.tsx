type TagListProps = {
  tags: string[];
};

export default function TagList({ tags }: TagListProps) {
  return (
    <div>
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-block p-1 rounded-md mr-2 mb-1 bg-[var(--color-honey-pastel)]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
