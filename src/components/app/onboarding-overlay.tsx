"use client"

import { useEffect, useRef, useState } from "react"

import type { TabKey } from "./types"
import { Button } from "../ui/button"

type OnboardingOverlayProps = {
  open: boolean
  onClose: () => void
  setTab: (tab: TabKey) => void
  openCreateContact: () => void
  openInteractionForFirstContact: () => void
  openAiPage: (seedText?: string) => void
  contactCount: number
  interactionCount: number
  onFinishOnboarding: () => void
}

export function OnboardingOverlay({
  open,
  onClose,
  setTab,
  openCreateContact,
  openInteractionForFirstContact,
  openAiPage,
  contactCount,
  interactionCount,
  onFinishOnboarding,
}: OnboardingOverlayProps) {
  const [step, setStep] = useState(1)
  const startContacts = useRef(contactCount)
  const startLogs = useRef(interactionCount)

  useEffect(() => {
    if (!open) return
    startContacts.current = contactCount
    startLogs.current = interactionCount
    setStep(1)
  }, [open, contactCount, interactionCount])

  useEffect(() => {
    if (!open || step !== 1) return
    if (contactCount > startContacts.current) setStep(2)
  }, [open, step, contactCount])

  useEffect(() => {
    if (!open || step !== 2) return
    if (interactionCount > startLogs.current) setStep(3)
  }, [open, step, interactionCount])

  function finish() {
    onFinishOnboarding()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-ds-md pb-ds-md backdrop-blur-[2px] md:items-center">
      <div className="relative w-full max-w-md rounded-ds border border-warm-base bg-paper p-ds-lg shadow-xl">
        <div className="absolute -top-2 left-8 h-4 w-4 rotate-45 border-l border-t border-warm-base bg-paper" aria-hidden />
        <p className="text-ds-caption font-medium text-[#7a5a2e]">新手指引 · 第 {step} / 3 步</p>
        {step === 1 ? (
          <>
            <h2 className="mt-ds-xs text-ds-title">添加第一位重要联系人</h2>
            <p className="mt-1 text-ds-body text-soft">
              「关系」页集中保存你在乎的人。添加后，真朋友指数与互动记录都会围绕 TA 展开。
            </p>
            <div className="mt-ds-md flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setTab("relations")
                  openCreateContact()
                }}
              >
                去添加联系人
              </Button>
              <Button variant="outline" onClick={() => setStep(2)}>
                我已有联系人，下一步
              </Button>
            </div>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <h2 className="mt-ds-xs text-ds-title">记录一次最近的互动</h2>
            <p className="mt-1 text-ds-body text-soft">
              每次见面或聊天后记一笔，能量值会帮你看见这段关系是滋养还是消耗。
            </p>
            <div className="mt-ds-md flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setTab("relations")
                  openInteractionForFirstContact()
                }}
              >
                去记一笔互动
              </Button>
              <Button variant="outline" onClick={() => setStep(3)}>
                跳过，下一步
              </Button>
            </div>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <h2 className="mt-ds-xs text-ds-title">体验一次 AI 咨询</h2>
            <p className="mt-1 text-ds-body text-soft">
              AI 会结合你的记录给出参考。已连接 Supabase 与 AI 服务时，请求会经服务端处理；完整数据与隐私说明以应用内《隐私政策》为准。
            </p>
            <div className="mt-ds-md flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  openAiPage("我最近在处理一段让我很累的关系，可以从哪里开始理清？")
                  finish()
                }}
              >
                打开 AI 咨询
              </Button>
              <Button variant="outline" onClick={finish}>
                稍后体验，进入观系
              </Button>
            </div>
          </>
        ) : null}
        <button type="button" className="mt-ds-md text-ds-caption text-soft underline underline-offset-2" onClick={finish}>
          跳过全部引导
        </button>
      </div>
    </div>
  )
}
