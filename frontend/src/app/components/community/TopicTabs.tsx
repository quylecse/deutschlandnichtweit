'use client';

import type { Topic } from '../../types/community';

interface TopicTabsProps {
  topics: Topic[];
  selectedTopicSlug: string;
  onSelectTopic: (slug: string) => void;
}

export default function TopicTabs({
  topics,
  selectedTopicSlug,
  onSelectTopic,
}: TopicTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar border-b border-[#111111]/15">
      <button
        type="button"
        onClick={() => onSelectTopic('')}
        className={`px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors shrink-0 cursor-pointer border ${
          selectedTopicSlug === ''
            ? 'bg-[#111111] text-[#F6F5F0] border-[#111111]'
            : 'bg-transparent text-[#6E6D68] border-[#D6D4CC] hover:border-[#111111] hover:text-[#111111]'
        }`}
      >
        Tất cả chủ đề
      </button>

      {topics.map((topic) => {
        const isActive = selectedTopicSlug === topic.slug;
        return (
          <button
            key={topic.id}
            type="button"
            onClick={() => onSelectTopic(topic.slug)}
            className={`px-3.5 py-1.5 text-xs font-mono tracking-wider transition-colors shrink-0 cursor-pointer border ${
              isActive
                ? 'bg-[#111111] text-[#F6F5F0] border-[#111111]'
                : 'bg-transparent text-[#6E6D68] border-[#D6D4CC] hover:border-[#111111] hover:text-[#111111]'
            }`}
          >
            #{topic.name}
          </button>
        );
      })}
    </div>
  );
}
