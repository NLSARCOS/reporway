'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Building } from 'lucide-react';
import { apiClient, useAuthStore } from '@/lib/auth';
import { toast } from 'sonner';

const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;

export default function OrganizationsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentOrganization, organizations } = useAuthStore();
  const router = useRouter();

  const { data: orgList, refetch } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => apiClient.get('/api/organizations'),
  });

  const form = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
  });

  const onSubmit = async (data: CreateOrgForm) => {
    setIsLoading(true);
    
    try {
      await apiClient.post('/api/organizations', data);
      
      toast.success('Organization created successfully!');
      setIsDialogOpen(false);
      form.reset();
      refetch();
    } catch (error) {
      toast.error('Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  const selectOrganization = (org: any) => {
    setCurrentOrganization(org);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-3xl font-bold text-gray-900">Your Organizations</h2>
          <p className="mt-2 text-sm text-gray-600">
            Select an organization to continue, or create a new one.
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer border-dashed border-2 hover:border-primary transition-colors">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center min-h-[200px]">
                    <Plus className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Create Organization</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Start a new organization to manage your projects
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Create a new organization to start managing your projects and team.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      placeholder="Acme Corp"
                      {...form.register('name')}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      placeholder="acme-corp"
                      {...form.register('slug')}
                    />
                    {form.formState.errors.slug && (
                      <p className="text-sm text-red-600">{form.formState.errors.slug.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      placeholder="A brief description of your organization"
                      {...form.register('description')}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Organization'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {orgList?.map((org: any) => (
              <Card key={org.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Building className="h-8 w-8 text-primary" />
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {org.role}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">{org.name}</h3>
                  <p className="mt-2 text-sm text-gray-500">{org.description || 'No description'}</p>
                  <Button 
                    onClick={() => selectOrganization(org)}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    Select Organization
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}