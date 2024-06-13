import { useOptimistic, useRef, useActionState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

async function getTodos() {
  const response = await fetch("http://localhost:8080/api/todos");
  return await response.json();
}

async function addTodo(text) {
  const response = await fetch("http://localhost:8080/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Failed to add todo");
  return await response.json();
}

function App() {
  const { data: todos, refetch } = useQuery({
    queryKey: ["todos"],
    queryFn: getTodos,
    initialData: [],
  });

  const [optimisticTodos, simplifiedAddTodo] = useOptimistic(
    todos,
    (state, text) => {
      return [...state, { id: Math.random().toString(36).slice(2), text }];
    }
  );

  const { mutateAsync: addTodoMutation } = useMutation({
    mutationFn: addTodo,
    onMutate: simplifiedAddTodo,
    onSuccess: refetch,
  });

  const formRef = useRef();

  async function addNewTodo() {
    const formData = new FormData(formRef.current);
    const newTodo = formData.get("text");
    try {
      await addTodoMutation(newTodo);
    } catch (error) {
      console.error(error);
    } finally {
      formRef.current.reset();
    }
  }

  const [actionState, addNewTodoWithState, isPending] =
    useActionState(addNewTodo);

  return (
    <>
      <ul>
        {optimisticTodos.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
      <form ref={formRef} action={addNewTodoWithState}>
        <input disabled={isPending} type="text" name="text" />
      </form>
    </>
  );
}

export default App;
