import type { Metadata } from "next";import {redirect} from "next/navigation";import {AppShell} from "@/components/app-shell";import {getNestContext} from "@/lib/nest";import {privateMetadata} from "@/lib/seo";
export const metadata:Metadata=privateMetadata("Your Nest");
export default async function Layout({children}:{children:React.ReactNode}){const context=await getNestContext();if(!context)redirect("/onboarding");return <AppShell nestName={context.nest.name}>{children}</AppShell>}
