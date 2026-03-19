import { Check } from 'lucide-react';
import { type WizardStep } from './types';

interface WizardProgressBarProps {
    steps: WizardStep[];
    currentStep: number;
    onStepClick: (step: number) => void;
}

export default function WizardProgressBar({ steps, currentStep, onStepClick }: WizardProgressBarProps) {
    return (
        <div className="flex items-center gap-1 mt-3">
            {steps.map((s, i) => {
                const isActive = currentStep === s.id;
                const isDone = currentStep > s.id;
                return (
                    <div key={s.id} className="flex items-center flex-1">
                        <button
                            type="button"
                            onClick={() => {
                                if (isDone || isActive) onStepClick(s.id);
                            }}
                            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md w-full transition-colors ${
                                isActive
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : isDone
                                        ? 'text-indigo-600 hover:bg-indigo-50 cursor-pointer'
                                        : 'text-gray-400 cursor-default'
                            }`}
                        >
                            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                                isActive
                                    ? 'bg-indigo-600 text-white'
                                    : isDone
                                        ? 'bg-indigo-100 text-indigo-600'
                                        : 'bg-gray-100 text-gray-400'
                            }`}>
                                {isDone ? <Check className="h-3.5 w-3.5" /> : s.id}
                            </div>
                            <span className="hidden sm:inline">{s.label}</span>
                        </button>
                        {i < steps.length - 1 && (
                            <div className={`h-px w-4 shrink-0 ${isDone ? 'bg-indigo-300' : 'bg-gray-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
