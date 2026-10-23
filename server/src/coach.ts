import {BedrockRuntimeClient, ConverseCommand} from '@aws-sdk/client-bedrock-runtime';
import type {WorkoutStats, WorkoutSummary} from '@spotter/protocol';

const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'us.amazon.nova-lite-v1:0';
const REGION = process.env.AWS_REGION ?? 'us-east-1';
const TIMEOUT_MS = 8000;

const SYSTEM_PROMPT = `You are Spotter, an upbeat, expert strength coach speaking to someone in their living room after a set of bodyweight squats.
Write 2-3 short sentences (max 55 words) that will be shown on a TV and read aloud.
Mention one concrete number from their set, one specific thing they did well, and one actionable cue for the next set.
Knee angle is measured at the bottom of each rep: lower is deeper; about 90 degrees is parallel, under 85 is below parallel.
Plain text only. No lists, emojis, markdown or medical claims.`;

const client = new BedrockRuntimeClient({region: REGION});

export function describeSet(stats: WorkoutStats): string {
  const lines = [
    `Full reps: ${stats.reps}`,
    `Half reps that didn't reach depth: ${stats.partialReps}`,
    `Set duration: ${stats.durationSec}s`,
  ];
  if (stats.avgDepth !== null) lines.push(`Average bottom knee angle: ${stats.avgDepth} degrees`);
  if (stats.bestDepth !== null) lines.push(`Deepest rep knee angle: ${stats.bestDepth} degrees`);
  if (stats.avgRepSec !== null) lines.push(`Average rep tempo: ${stats.avgRepSec}s`);
  if (stats.repLog.length > 1) {
    lines.push(`Per-rep bottom knee angles in order: ${stats.repLog.map((r) => r.depth).join(', ')}`);
  }
  return lines.join('\n');
}

export function localCoaching(stats: WorkoutStats): string {
  if (stats.reps === 0) {
    return stats.partialReps > 0
      ? `I saw ${stats.partialReps} half reps. Sit back like you're reaching for a chair and get your thighs to parallel, and every one will count.`
      : "I didn't catch any full reps. Stand side-on to the camera with your whole body in view, then let's go again.";
  }
  const praise =
    stats.bestDepth !== null && stats.bestDepth <= 85
      ? `${stats.reps} reps, and your deepest hit ${stats.bestDepth}°, below parallel.`
      : `${stats.reps} solid reps.`;
  const cue =
    stats.partialReps > 0
      ? `${stats.partialReps} didn't reach depth, so focus on sitting lower each time.`
      : stats.avgRepSec !== null && stats.avgRepSec < 1.5
        ? 'Slow the way down to about two seconds for more control.'
        : 'Keep that steady tempo and add a few more reps next set.';
  return `${praise} ${cue}`;
}

export async function summarize(stats: WorkoutStats): Promise<WorkoutSummary> {
  try {
    const response = await client.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        system: [{text: SYSTEM_PROMPT}],
        messages: [{role: 'user', content: [{text: describeSet(stats)}]}],
        inferenceConfig: {maxTokens: 200, temperature: 0.6},
      }),
      {abortSignal: AbortSignal.timeout(TIMEOUT_MS)},
    );
    const text = response.output?.message?.content?.find((c) => c.text)?.text?.trim();
    if (text) return {stats, coaching: text, source: 'bedrock'};
  } catch (err) {
    console.warn(`Bedrock unavailable, using local coaching: ${(err as Error).name}: ${(err as Error).message}`);
  }
  return {stats, coaching: localCoaching(stats), source: 'local'};
}
