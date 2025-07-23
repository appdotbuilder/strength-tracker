
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, Target, Plus, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import type { Goal, Exercise, PersonalBest, CreateGoalInput } from '../../../server/src/schema';

interface GoalsManagerProps {
  goals: Goal[];
  exercises: Exercise[];
  personalBests: PersonalBest[];
  onCreateGoal: (data: CreateGoalInput) => Promise<void>;
  currentUserId: number;
  getPersonalBestForExercise: (exerciseId: number) => PersonalBest | undefined;
}

export function GoalsManager({ 
  goals, 
  exercises, 
  onCreateGoal, 
  currentUserId,
  getPersonalBestForExercise 
}: GoalsManagerProps) {
  const [goalData, setGoalData] = useState<CreateGoalInput>({
    user_id: currentUserId,
    exercise_id: 0,
    target_weight: 0,
    target_reps: 1,
    target_date: null
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateGoal(goalData);
    // Reset form
    setGoalData({
      user_id: currentUserId,
      exercise_id: 0,
      target_weight: 0,
      target_reps: 1,
      target_date: null
    });
    setIsDialogOpen(false);
  };

  const calculateProgress = (goal: Goal): number => {
    const personalBest = getPersonalBestForExercise(goal.exercise_id);
    if (!personalBest) return 0;
    
    // Simple progress calculation based on weight
    const progress = (personalBest.weight / goal.target_weight) * 100;
    return Math.min(progress, 100);
  };

  const activeGoals = goals.filter(goal => !goal.achieved);
  const achievedGoals = goals.filter(goal => goal.achieved);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">🎯 Lifting Goals</h2>
          <p className="text-gray-600">Track your strength targets and progress</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>🎯 Create New Goal</DialogTitle>
              <DialogDescription>
                Set a strength target for a specific exercise
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="goal-exercise">Exercise *</Label>
                <Select
                  value={goalData.exercise_id.toString()}
                  onValueChange={(value) =>
                    setGoalData((prev: CreateGoalInput) => ({ ...prev, exercise_id: parseInt(value) }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map(exercise => (
                      <SelectItem key={exercise.id} value={exercise.id.toString()}>
                        {exercise.name} ({exercise.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-weight">Target Weight (lbs) *</Label>
                  <Input
                    id="target-weight"
                    type="number"
                    value={goalData.target_weight}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setGoalData((prev: CreateGoalInput) => ({ 
                        ...prev, 
                        target_weight: parseFloat(e.target.value) || 0 
                      }))
                    }
                    placeholder="225"
                    min="0"
                    step="0.5"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="target-reps">Target Reps *</Label>
                  <Input
                    id="target-reps"
                    type="number"
                    value={goalData.target_reps}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setGoalData((prev: CreateGoalInput) => ({ 
                        ...prev, 
                        target_reps: parseInt(e.target.value) || 1 
                      }))
                    }
                    placeholder="5"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Target Date (Optional)</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {goalData.target_date 
                        ? format(goalData.target_date, 'PPP')
                        : 'Select target date (optional)'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={goalData.target_date || undefined}
                      onSelect={(date) => {
                        setGoalData((prev: CreateGoalInput) => ({ ...prev, target_date: date || null }));
                        setIsCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Create Goal
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Goals */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Active Goals ({activeGoals.length})
            </CardTitle>
            <CardDescription>Goals you're currently working towards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeGoals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active goals</p>
                <p className="text-sm">Create your first strength goal above!</p>
              </div>
            ) : (
              activeGoals.map((goal: Goal) => {
                const exercise = exercises.find(e => e.id === goal.exercise_id);
                const progress = calculateProgress(goal);
                const personalBest = getPersonalBestForExercise(goal.exercise_id);
                
                return (
                  <div key={goal.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-blue-900">
                          {exercise?.name || 'Unknown Exercise'}
                        </h4>
                        <p className="text-sm text-blue-700">
                          Target: {goal.target_weight} lbs × {goal.target_reps} rep{goal.target_reps !== 1 ? 's' : ''}
                        </p>
                        {goal.target_date && (
                          <p className="text-xs text-blue-600">
                            Target date: {goal.target_date.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        {progress.toFixed(0)}%
                      </Badge>
                    </div>
                    
                    <Progress value={progress} className="mb-2" />
                    
                    {personalBest ? (
                      <p className="text-xs text-blue-600">
                        Current best: {personalBest.weight} lbs × {personalBest.reps} rep{personalBest.reps !== 1 ? 's' : ''}
                      </p>
                    ) : (
                      <p className="text-xs text-blue-600">
                        No personal best recorded yet
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Achieved Goals */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Achieved Goals ({achievedGoals.length})
            </CardTitle>
            <CardDescription>Goals you've successfully completed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {achievedGoals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No achieved goals yet</p>
                <p className="text-sm">Keep training to achieve your first goal!</p>
              </div>
            ) : (
              achievedGoals.map((goal: Goal) => {
                const exercise = exercises.find(e => e.id === goal.exercise_id);
                
                return (
                  <div key={goal.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-green-900">
                          {exercise?.name || 'Unknown Exercise'}
                        </h4>
                        <p className="text-sm text-green-700">
                          Achieved: {goal.target_weight} lbs × {goal.target_reps} rep{goal.target_reps !== 1 ? 's' : ''}
                        </p>
                        {goal.achieved_date && (
                          <p className="text-xs text-green-600">
                            Achieved: {goal.achieved_date.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                        ✓ Done
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goal Insights */}
      {goals.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Goal Insights
            </CardTitle>
            <CardDescription>Your strength goal statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{goals.length}</div>
                <div className="text-sm text-gray-600">Total Goals Set</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{achievedGoals.length}</div>
                <div className="text-sm text-green-600">Goals Achieved</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{activeGoals.length}</div>
                <div className="text-sm text-blue-600">Active Goals</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
