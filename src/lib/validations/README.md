# Form Validation Guide

This project uses **react-hook-form** + **Zod** for type-safe form validation.

## Why This Approach?

✅ **Type-safe** - Full TypeScript support with autocomplete
✅ **Reusable** - Share validation schemas between frontend and backend
✅ **Better UX** - Real-time validation with error messages
✅ **Better Performance** - Less re-renders compared to manual `useState`
✅ **Less Code** - No manual error state management

## Quick Start

### 1. Create a Validation Schema

Create a Zod schema in `/src/lib/validations/`:

```typescript
// src/lib/validations/myform.ts
import { z } from "zod";

export const myFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  age: z.number().min(18, "Must be 18 or older"),
});

export type MyFormInput = z.infer<typeof myFormSchema>;
```

### 2. Use in tRPC Router (Backend)

```typescript
// src/server/api/routers/myrouter.ts
import { myFormSchema } from "~/lib/validations/myform";

export const myRouter = createTRPCRouter({
  create: protectedProcedure
    .input(myFormSchema)
    .mutation(async ({ ctx, input }) => {
      // input is fully typed and validated!
      return await ctx.db.myTable.create({ data: input });
    }),
});
```

### 3. Use in React Component (Frontend)

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { myFormSchema, type MyFormInput } from "~/lib/validations/myform";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export function MyForm() {
  // Initialize form with react-hook-form + zod
  const form = useForm<MyFormInput>({
    resolver: zodResolver(myFormSchema),
    defaultValues: {
      email: "",
      password: "",
      age: 18,
    },
  });

  // tRPC mutation
  const createMutation = api.myrouter.create.useMutation({
    onSuccess: () => {
      toast.success("Created!");
      form.reset();
    },
  });

  const onSubmit = (data: MyFormInput) => {
    createMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" loading={createMutation.isPending}>
          Submit
        </Button>
      </form>
    </Form>
  );
}
```

## Advanced Patterns

### Select Fields

```typescript
<FormField
  control={form.control}
  name="role"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Role</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Trigger Validation Manually

```typescript
// Validate specific fields
const isValid = await form.trigger(["email", "password"]);

// Validate all fields
const isValid = await form.trigger();
```

### Access Form Values

```typescript
// Get single value
const email = form.getValues("email");

// Get all values
const allValues = form.getValues();

// Watch for changes (reactive)
const email = form.watch("email");
```

### Conditional Validation

```typescript
const schema = z.object({
  hasAddress: z.boolean(),
  address: z.string().optional(),
}).refine(
  (data) => {
    // If hasAddress is true, address is required
    if (data.hasAddress && !data.address) {
      return false;
    }
    return true;
  },
  {
    message: "Address is required",
    path: ["address"], // Show error on address field
  }
);
```

### Custom Error Messages

```typescript
const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
});
```

## Migration from Old Forms

**Before (Manual Validation):**
```typescript
const [formData, setFormData] = useState({ email: "" });
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!formData.email) {
    newErrors.email = "Email is required";
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**After (react-hook-form + zod):**
```typescript
const form = useForm<MyFormInput>({
  resolver: zodResolver(myFormSchema),
});

// Validation happens automatically!
```

## Examples in Codebase

- ✅ **OnboardingWizardV2** - Multi-step form with validation
- ✅ **InviteDialog** - Simple form (needs migration)

## Common Issues

### Issue: Form not validating on submit
**Solution:** Make sure you're using `form.handleSubmit(onSubmit)` and not calling `onSubmit` directly.

### Issue: Select field not working
**Solution:** Use `onValueChange={field.onChange}` instead of `{...field}` for Select components.

### Issue: Optional fields showing as required
**Solution:** Use `.optional()` in your Zod schema and provide empty string as default value.
