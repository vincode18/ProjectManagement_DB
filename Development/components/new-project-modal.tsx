'use client';

import { useState } from 'react';
import type { User } from '@/lib/types';
import { Button } from './ui';
import { Modal } from './modal';
import { ProjectForm } from './project-form';

export function NewProjectModal({ users }: { users: User[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>New Project</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Project">
        <ProjectForm mode="create" users={users} onSaved={() => setOpen(false)} />
      </Modal>
    </>
  );
}
