import { Database } from '@/lib/schema'
import { Session, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'

type Todos = Database['public']['Tables']['todos']['Row']

function TodoList({ session }: { session: Session }) {
  const supabase = useSupabaseClient<Database>()
  const [todos, setTodos] = useState<Todos[]>([])
  const [newTaskText, setNewTaskText] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [errorText, setErrorText] = useState('')

  const user = session.user

  const validateUser = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
  
    return data ? true : false;
  };

  useEffect(() => {
    const fetchTodos = async () => {
      let query = supabase.from('todos').select('*').order('id', { ascending: true });
      query = query.eq("assigned_to", user.id);

      try {
        const { data: todos, error} = await query;
        if (error) throw error;

        setTodos(todos);
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    }

    fetchTodos();
  }, [supabase, user.id]);


  useEffect(() => {
    const fetchOverdueTasks = async () => {
      const { data: todos, error } = await supabase
        .from('todos')
        .select('*')
        .lt("due_date", new Date().toISOString())
        .eq("assigned_to", user.id)

      if (error) console.log('error', error)
      else setTodos(todos)
    }

    fetchOverdueTasks()
  }, [supabase])

  useEffect(() => {
    const fetchTasksDueToday = async () => {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data: todos, error } = await supabase
        .from('todos')
        .select('*')
        .gte("due_date", startOfDay)
        .lte("due_date", endOfDay)
        .eq("assigned_to", user.id)

      if (error) console.log('error', error)
      else setTodos(todos)
    }

    fetchTasksDueToday()
  }, [supabase])
  

  const addTodo = async (taskText: string, assignedTo: string, dueDate: string) => {
    let task = taskText.trim()
    const assignedUser = assignedTo.trim()
    const due = dueDate.trim()

    if (!task.length) {
      setErrorText("Task cannot be empty.");
      return;
    }

    if (!assignedUser) {
      setErrorText("Assigned to cannot be empty.");
      return;
    }

    try {
      const { data: todo, error } = await supabase
        .from('todos')
        .insert({ task, user_id: user.id, assigned_to: assignedUser, due_date: dueDate || null})
        .select()
        .single();

      if (error) throw error;

      setTodos([...todos, todo]);
      setNewTaskText('');
      setAssignedTo('');
      setDueDate('');
      setErrorText('');
      
    } catch (error) {
      setErrorText("Failed to add task.")
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await supabase.from('todos').delete().eq('id', id).throwOnError()
      setTodos(todos.filter((x) => x.id != id))
    } catch (error) {
      console.log('error', error)
    }
  }

  return (
    <div className="w-full">
      <h1 className="mb-12">Todo List.</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          addTodo(newTaskText, assignedTo, dueDate)
        }}
        className="flex gap-2 my-2"
      >
        <input
          className="rounded w-full p-2"
          type="text"
          placeholder="make coffee"
          value={newTaskText}
          onChange={(e) => {
            setErrorText('')
            setNewTaskText(e.target.value)
          }}
        />
        
        <input
          className="rounded w-full p-2"
          type="text"
          placeholder="Assigned to (user ID)"
          onChange={(e) => {
            setAssignedTo(e.target.value)
          }}
        />
        
        <input
          className="rounded w-full p-2"
          type="date"
          placeholder="Due date for"
          onChange={(e) => {
            setDueDate(e.target.value)
          }}
        />
        <button className="btn-black" type="submit">
          Add
        </button>
      </form>
      {!!errorText && <Alert text={errorText} />}
      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul>
          {todos.map((todo) => (
            <Todo key={todo.id} todo={todo} onDelete={() => deleteTodo(todo.id)} />
          ))}
        </ul>
      </div>
    </div>
  )
}

const Todo = ({ todo, onDelete }: { todo: Todos; onDelete: () => void }) => {
  const supabase = useSupabaseClient<Database>()
  const [isCompleted, setIsCompleted] = useState(todo.is_complete)

  const toggle = async () => {
    try {
      const { data } = await supabase
        .from('todos')
        .update({ is_complete: !isCompleted })
        .eq('id', todo.id)
        .throwOnError()
        .select()
        .single()

      if (data) setIsCompleted(data.is_complete)
    } catch (error) {
      console.log('error', error)
    }
  }

  return (
    <li className="w-full block cursor-pointer hover:bg-200 focus:outline-none focus:bg-200 transition duration-150 ease-in-out">
      <div className="text-sm text-gray-500">
        Assigned to: {todo.assigned_to || 'No one'}
      </div>
      <div className="flex items-center px-4 py-4 sm:px-6">
        <div className="min-w-0 flex-1 flex items-center">
          <div className="text-sm leading-5 font-medium truncate">{todo.task}</div>
        </div>
        <div>
          <input
            className="cursor-pointer"
            onChange={(e) => toggle()}
            type="checkbox"
            checked={isCompleted ? true : false}
          />
        </div>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
          className="w-4 h-4 ml-2 border-2 hover:border-black rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="gray">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </li>
  )
}

const Alert = ({ text }: { text: string }) => (
  <div className="rounded-md bg-red-100 p-4 my-3">
    <div className="text-sm leading-5 text-red-700">{text}</div>
  </div>
)

export default TodoList