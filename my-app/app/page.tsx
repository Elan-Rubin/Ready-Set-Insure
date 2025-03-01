import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="relative flex h-screen items-center justify-center bg-muted p-6 md:p-10">
      <div className="relative hidden bg-muted lg:block">
        <img
          src="./insurance_graphic.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  )
}