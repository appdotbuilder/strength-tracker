
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { Exercise, CreateWorkoutInput, CreateExerciseInput } from '../../../server/src/schema';

interface CreateWorkoutFormProps {
  exercises: Exercise[];
  onCreateWorkout: (data: CreateWorkoutInput) => Promise<void>;
  onCreateExercise: (data: CreateExerciseInput) => Promise<void>;
  isLoading: boolean;
  currentUserId: number;
}

export function CreateWorkoutForm({ 
  exercises, 
  onCreateWorkout, 
  onCreateExercise, 
  isLoading, 
  currentUserId 
}: CreateWorkoutFormProps) {
  const [workoutData, setWorkoutData] = useState<CreateWorkoutInput>({
    user_id: currentUserId,
    name: '',
    date: new Date(),
    notes: null
  });

  const [exerciseData, setExerciseData] = useState<CreateExerciseInput>({
    name: '',
    category: '',
    description: null
  });

  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const exerciseCategories = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'];

  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateWorkout(workoutData);
    // Reset form
    setWorkoutData({
      user_id: currentUserId,
      name: '',
      date: new Date(),
      notes: null
    });
  };

  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateExercise(exerciseData);
    // Reset form and close dialog
    setExerciseData({
      name: '',
      category: '',
      description: null
    });
    setIsExerciseDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💪 Create New Workout
          </CardTitle>
          <CardDescription>Plan your strength training session</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWorkoutSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workout-name">Workout Name *</Label>
                  <Input
                    id="workout-name"
                    value={workoutData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWorkoutData((prev: CreateWorkoutInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Upper Body Strength, Leg Day, Push Day"
                    required
                  />
                </div>

                <div>
                  <Label>Workout Date *</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(workoutData.date, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={workoutData.date}
                        onSelect={(date) => {
                          if (date) {
                            setWorkoutData((prev: CreateWorkoutInput) => ({ ...prev, date }));
                            setIsCalendarOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="workout-notes">Notes (Optional)</Label>
                <Textarea
                  id="workout-notes"
                  value={workoutData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setWorkoutData((prev: CreateWorkoutInput) => ({
                      ...prev,
                      notes: e.target.value || null
                    }))
                  }
                  placeholder="Any notes about your workout plan, goals, or modifications..."
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Creating Workout...' : '🎯 Create Workout'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              🏋️‍♂️ Available Exercises
            </span>
            <Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Exercise</DialogTitle>
                  <DialogDescription>
                    Add a new exercise to your library
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleExerciseSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="exercise-name">Exercise Name *</Label>
                    <Input
                      id="exercise-name"
                      value={exerciseData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExerciseData((prev: CreateExerciseInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., Incline Dumbbell Press"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="exercise-category">Category *</Label>
                    <Select
                      value={exerciseData.category || ''}
                      onValueChange={(value) =>
                        setExerciseData((prev: CreateExerciseInput) => ({ ...prev, category: value }))
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {exerciseCategories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="exercise-description">Description (Optional)</Label>
                    <Textarea
                      id="exercise-description"
                      value={exerciseData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setExerciseData((prev: CreateExerciseInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      placeholder="Exercise form tips, variations, or notes..."
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Create Exercise
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>Exercises in your library ({exercises.length} total)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exercises.map((exercise: Exercise) => (
              <div key={exercise.id} className="p-3 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{exercise.category}</p>
                {exercise.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{exercise.description}</p>
                )}
              </div>
            ))}
            
            {exercises.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <p>No exercises available</p>
                <p className="text-sm">Create your first exercise above!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
