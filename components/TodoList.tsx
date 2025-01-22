import { Database } from '@/lib/schema'
import { Session, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { fetchAllUsers } from '@/lib/fetchAllUsers'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Todos = Database['public']['Tables']['todos']['Row']

function TodoList({ session }: { session: Session }) {
  const supabase = useSupabaseClient<Database>()
  const [todos, setTodos] = useState<Todos[]>([])
  const [newTaskText, setNewTaskText] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [errorText, setErrorText] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'assignedToMe' | 'createdByMe' | 'overdue' | 'dueToday'>('all')

  const user = session.user;

  const getUsers = async () => {
    try {
      const usersData = await fetchAllUsers();
      console.log("Fetched Users: ", usersData)
      setUsers(usersData)
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    getUsers()
  }, []);

  
  const addCurrentUserToPublicUsers = async () => {
    try {
      const { error } = await supabase
        .from('users') 
        .insert({
          id: user.id,
          email: user.email || ""
        });

      if (error) {
        console.error('Failed to insert user:', error);
        toast.error('Failed to add user to the list.');
      } else {
        toast.success('Successfully joined the Todo List!');
        await getUsers();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred.');
    }
  };


  const fetchTodos = async () => {
    let query = supabase.from('todos').select('*').order('id', { ascending: true });
    if (filter === "assignedToMe") {
      query = query.eq("assigned_to", user.id)

    } else if (filter === "createdByMe") {
      query = query.eq("assigned_by", user.id)

    } else if (filter === "overdue") {
      query = query.lt("due_date", new Date().toISOString())

    } else if (filter === "dueToday") {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0,0,0,0)).toISOString()
      const endOfDay = new Date(today.setHours(23,59,59,999)).toISOString()
      query = query.gte("due_date", startOfDay).lte("due_date", endOfDay)
    }

    try {
      const { data: todos, error} = await query;
      if (error) throw error;
      setTodos(todos);

    } catch (error) {
      console.error("Error fetching todos:", error);
    }
  };


  useEffect(() => {
    fetchTodos();

    const channel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        (payload) => {
          console.log(payload)
          if (payload.eventType === 'INSERT' && payload.new.assigned_to === user.id) {
            setTodos((prev) => [...prev, payload.new as Todos])
            toast.info(`New Task Assigned: ${payload.new.task}`);
          } else if (payload.eventType === 'DELETE') {
            setTodos((prev) => prev.filter((todo) => todo.id !== payload.old?.id))
          } else if (payload.eventType === 'UPDATE') {
            setTodos((prev) =>
              prev.map((todo) => (todo.id === payload.new.id ? (payload.new as Todos) : todo))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }



  }, [supabase, user.id, filter]);

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

    const formattedDueDate = due
    ? new Date(due).toISOString() // Convert to a proper timestamp
    : null;


    try {
      const { data: todo, error } = await supabase
        .from('todos')
        .insert({ task, user_id: user.id, assigned_to: assignedUser, assigned_by: user.id, due_date: formattedDueDate})
        .select()
        .single();

      if (error) throw error;
    
      setTodos((prevTodos) => [...prevTodos, todo]);
      await fetchTodos()
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
  
      <div className="mb-6">
        <button
          onClick={addCurrentUserToPublicUsers}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded"
        >
          Join the Todo List
        </button>
        <p className="text-gray-600 mt-2">
          Click this button to add yourself to the Todo List.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilter("all")} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>
          All Tasks
        </button>
        <button onClick={() => setFilter("assignedToMe")} className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'>
          Tasks Assigned To ME
        </button>
        <button onClick={() => setFilter("createdByMe")} className='bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded'>
          MY Created Tasks
        </button>
        <button onClick={() => setFilter("overdue")} className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded'>
          Overdue Tasks
        </button>
        <button onClick={() => setFilter("dueToday")} className='bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded'>
          Tasks Due Today
        </button>

      </div>
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
          placeholder="Add a task description!"
          value={newTaskText}
          onChange={(e) => {
            setErrorText('')
            setNewTaskText(e.target.value)
          }}
        />

        <select 
          className="rounded w-full p-2"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        >
          <option value="">Assign to...</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.email}
            </option>
          ))}
        </select>
        
        <input
          className="rounded w-full p-2"
          type="datetime-local"
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
      <div className="flex items-center px-4 py-4 sm:px-6">
        <div className="min-w-0 flex-1 flex items-center">
          <div className="text-sm leading-5 font-medium truncate">{todo.task}</div>
          <span className='ml-4 text-sm text-gray-500'>
            Due: {todo.due_date ? new Date(todo.due_date).toLocaleString() : 'No due date'}
          </span>
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