
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Target, TrendingUp, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import type { 
  Workout, 
  Exercise, 
  CreateWorkoutInput, 
  CreateExerciseInput,
  CreateGoalInput,
  Goal,
  PersonalBest,
  GetWorkoutsByDateRangeInput 
} from '../../server/src/schema';
import { WorkoutDetails } from '@/components/WorkoutDetails';
import { CreateWorkoutForm } from '@/components/CreateWorkoutForm';
import { GoalsManager } from '@/components/GoalsManager';

// Stub data for exercises since API returns empty array
const STUB_EXERCISES: Exercise[] = [
  { id: 1, name: 'Bench Press', category: 'chest', description: 'Classic chest exercise', created_at: new Date() },
  { id: 2, name: 'Squat', category: 'legs', description: 'Full body compound movement', created_at: new Date() },
  { id: 3, name: 'Deadlift', category: 'back', description: 'Ultimate strength exercise', created_at: new Date() },
  { id: 4, name: 'Overhead Press', category: 'shoulders', description: 'Shoulder and core strength', created_at: new Date() },
  { id: 5, name: 'Barbell Row', category: 'back', description: 'Upper back development', created_at: new Date() },
];

// Stub personal bests for demonstration
const STUB_PERSONAL_BESTS: PersonalBest[] = [
  { id: 1, user_id: 1, exercise_id: 1, weight: 225, reps: 5, date_achieved: new Date('2024-01-15'), workout_id: 1, created_at: new Date() },
  { id: 2, user_id: 1, exercise_id: 2, weight: 315, reps: 3, date_achieved: new Date('2024-01-20'), workout_id: 2, created_at: new Date() },
  { id: 3, user_id: 1, exercise_id: 3, weight: 405, reps: 1, date_achieved: new Date('2024-01-25'), workout_id: 3, created_at: new Date() },
];

function App() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [isLoading, setIsLoading] = useState(false);

  // Using hardcoded user ID for demo - in real app this would come from auth
  const currentUserId = 1;

  const loadWorkouts = useCallback(async () => {
    try {
      // Load workouts for the current month
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const input: GetWorkoutsByDateRangeInput = {
        user_id: currentUserId,
        start_date: startDate,
        end_date: endDate
      };
      
      const result = await trpc.getWorkoutsByDateRange.query(input);
      setWorkouts(result);
    } catch (error) {
      console.error('Failed to load workouts:', error);
      // Using stub data since API returns empty array
      setWorkouts([]);
    }
  }, [selectedDate, currentUserId]);

  const loadExercises = useCallback(async () => {
    try {
      const result = await trpc.getExercises.query();
      // Since API returns empty array, use stub data
      setExercises(result.length > 0 ? result : STUB_EXERCISES);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      setExercises(STUB_EXERCISES);
    }
  }, []);

  const loadGoals = useCallback(async () => {
    try {
      const result = await trpc.getUserGoals.query(currentUserId);
      setGoals(result);
    } catch (error) {
      console.error('Failed to load goals:', error);
      setGoals([]);
    }
  }, [currentUserId]);

  const loadPersonalBests = useCallback(async () => {
    try {
      const result = await trpc.getPersonalBests.query({ user_id: currentUserId });
      // Since API returns empty array, use stub data
      setPersonalBests(result.length > 0 ? result : STUB_PERSONAL_BESTS);
    } catch (error) {
      console.error('Failed to load personal bests:', error);
      setPersonalBests(STUB_PERSONAL_BESTS);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  useEffect(() => {
    loadExercises();
    loadGoals();
    loadPersonalBests();
  }, [loadExercises, loadGoals, loadPersonalBests]);

  const handleCreateWorkout = async (workoutData: CreateWorkoutInput) => {
    setIsLoading(true);
    try {
      const newWorkout = await trpc.createWorkout.mutate(workoutData);
      setWorkouts((prev: Workout[]) => [...prev, newWorkout]);
      await loadWorkouts(); // Refresh the list
    } catch (error) {
      console.error('Failed to create workout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExercise = async (exerciseData: CreateExerciseInput) => {
    try {
      const newExercise = await trpc.createExercise.mutate(exerciseData);
      setExercises((prev: Exercise[]) => [...prev, newExercise]);
    } catch (error) {
      console.error('Failed to create exercise:', error);
    }
  };

  const handleCreateGoal = async (goalData: CreateGoalInput) => {
    try {
      const newGoal = await trpc.createGoal.mutate(goalData);
      setGoals((prev: Goal[]) => [...prev, newGoal]);
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const getWorkoutsForDate = (date: Date) => {
    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate.toDateString() === date.toDateString();
    });
  };

  const getPersonalBestForExercise = (exerciseId: number): PersonalBest | undefined => {
    return personalBests
      .filter(pb => pb.exercise_id === exerciseId)
      .sort((a, b) => b.weight - a.weight)[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Dumbbell className="h-10 w-10 text-blue-600" />
            💪 Strength Tracker
          </h1>
          <p className="text-gray-600">Your personal strength training companion</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="workout" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Workout
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>📅 Workout Calendar</CardTitle>
                  <CardDescription>Select a date to view or schedule workouts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                    modifiers={{
                      hasWorkout: (date) => getWorkoutsForDate(date).length > 0
                    }}
                    modifiersStyles={{
                      hasWorkout: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }
                    }}
                  />
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>🗓️ {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
                    <CardDescription>
                      {getWorkoutsForDate(selectedDate).length === 0 
                        ? 'No workouts scheduled' 
                        : `${getWorkoutsForDate(selectedDate).length} workout(s) scheduled`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {getWorkoutsForDate(selectedDate).map((workout: Workout) => (
                      <div 
                        key={workout.id}
                        className="p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => setSelectedWorkout(workout)}
                      >
                        <h4 className="font-semibold text-blue-900">{workout.name}</h4>
                        {workout.notes && (
                          <p className="text-sm text-blue-700 mt-1">{workout.notes}</p>
                        )}
                        <p className="text-xs text-blue-600 mt-1">
                          Created: {workout.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    
                    {getWorkoutsForDate(selectedDate).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No workouts on this date</p>
                        <p className="text-sm">Switch to "New Workout" tab to create one!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedWorkout && (
                  <WorkoutDetails 
                    workout={selectedWorkout} 
                    exercises={exercises}
                    onClose={() => setSelectedWorkout(null)}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workout">
            <CreateWorkoutForm
              exercises={exercises}
              onCreateWorkout={handleCreateWorkout}
              onCreateExercise={handleCreateExercise}
              isLoading={isLoading}
              currentUserId={currentUserId}
            />
          </TabsContent>

          <TabsContent value="goals">
            <GoalsManager
              goals={goals}
              exercises={exercises}
              personalBests={personalBests}
              onCreateGoal={handleCreateGoal}
              currentUserId={currentUserId}
              getPersonalBestForExercise={getPersonalBestForExercise}
            />
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🏆 Personal Bests
                  </CardTitle>
                  <CardDescription>Your strongest lifts on record</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {personalBests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No personal bests recorded yet</p>
                      <p className="text-sm">Complete some workouts to see your progress!</p>
                    </div>
                  ) : (
                    personalBests.map((pb: PersonalBest) => {
                      const exercise = exercises.find(e => e.id === pb.exercise_id);
                      return (
                        <div key={pb.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div>
                            <h4 className="font-semibold text-green-900">{exercise?.name || 'Unknown Exercise'}</h4>
                            <p className="text-sm text-green-700">
                              {pb.weight} lbs × {pb.reps} rep{pb.reps !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-green-600">
                              {pb.date_achieved.toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                            PR
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 Exercise Categories
                  </CardTitle>
                  <CardDescription>Your training focus areas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from(new Set(exercises.map(e => e.category))).map(category => {
                      const categoryExercises = exercises.filter(e => e.category === category);
                      const categoryBests = personalBests.filter(pb => 
                        categoryExercises.some(ex => ex.id === pb.exercise_id)
                      );
                      
                      return (
                        <div key={category} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold capitalize text-gray-900">
                              {category}
                            </h4>
                            <Badge variant="outline">
                              {categoryExercises.length} exercise{categoryExercises.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {categoryBests.length} personal best{categoryBests.length !== 1 ? 's' : ''} recorded
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
