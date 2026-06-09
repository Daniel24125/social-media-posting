'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WorkspaceSwitcherProps {
  currentProjectId: string;
  projects: { id: string; name: string }[];
}

export function WorkspaceSwitcher({ currentProjectId, projects }: WorkspaceSwitcherProps) {
  const router = useRouter();

  const handleValueChange = (value: string) => {
    if (value === 'NEW_WORKSPACE') {
      router.push('/onboarding');
    } else {
      router.push(`/dashboard/${value}`);
    }
  };

  return (
    <Select value={currentProjectId} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full bg-transparent border-none text-sm font-semibold focus:ring-0 focus:ring-offset-0 dark:text-white h-auto p-0 shadow-none hover:bg-transparent">
        <SelectValue placeholder="Select a workspace" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value="NEW_WORKSPACE" className="font-medium text-blue-600 cursor-pointer">
          + Create New Workspace
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
