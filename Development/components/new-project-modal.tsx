'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { User } from '@/lib/types';
import { Button } from './ui';
import { Modal } from './modal';
import { ProjectForm } from './project-form';

export function NewProjectModal({ users }: { users: User[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Project
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Project">
        <ProjectForm mode="create" users={users} onSaved={() => setOpen(false)} />
      </Modal>
    </>
  );
}
