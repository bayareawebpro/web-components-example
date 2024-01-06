export default function clamp(val, min = 1, max = 10) {
    return Math.min(Math.max(val, min), max)
}