import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Github, Linkedin, Mail, Clock, Heart } from 'lucide-react'
import Header from '../components/Header'
import BuyMeCoffee from '../components/BuyMeCoffee'
import creatorPhoto from '../../assets/me.jpeg'

const typewriterPhrases = [
  'Stories that breathe.',
  'Ideas worth lingering on.',
  'Write with intention.',
  'Craft your narrative.',
  'Depth over speed.',
]

function TypewriterHero() {
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const phrase = typewriterPhrases[phraseIdx]
    let timeout

    if (!deleting && charIdx < phrase.length) {
      timeout = setTimeout(() => setCharIdx(c => c + 1), 70)
    } else if (!deleting && charIdx === phrase.length) {
      timeout = setTimeout(() => setDeleting(true), 2200)
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(c => c - 1), 40)
    } else if (deleting && charIdx === 0) {
      setDeleting(false)
      setPhraseIdx(i => (i + 1) % typewriterPhrases.length)
    }

    return () => clearTimeout(timeout)
  }, [charIdx, deleting, phraseIdx])

  const displayText = typewriterPhrases[phraseIdx].substring(0, charIdx)

  return (
    <div className="relative flex h-full min-h-[420px] items-center justify-center">
      {/* Background blobs */}
      <div className="animate-float absolute left-[8%] top-[12%] h-36 w-36 rounded-full bg-primary/10 blur-xl" />
      <div className="animate-float-slow absolute right-[12%] top-[8%] h-28 w-28 rounded-full bg-primary-fixed/30 blur-xl" />
      <div className="animate-float-delayed absolute bottom-[18%] left-[18%] h-24 w-24 rounded-full bg-tertiary/8 blur-xl" />
      <div className="animate-float absolute bottom-[12%] right-[8%] h-32 w-32 rounded-full bg-primary-container/20 blur-xl" />

      {/* Notebook card */}
      <div className="relative z-10 w-[320px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-2xl shadow-primary/5">
        {/* Notebook header dots */}
        <div className="mb-6 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-error/40" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-primary/40" />
          <div className="ml-auto h-1 w-12 rounded-full bg-outline-variant/20" />
        </div>

        {/* Ruled lines */}
        <div className="space-y-4">
          <div className="h-[1px] bg-outline-variant/10" />
          <div className="h-[1px] bg-outline-variant/10" />
          <div className="h-[1px] bg-outline-variant/10" />
        </div>

        {/* Typewriter text */}
        <div className="mt-4 min-h-[56px]">
          <p className="font-headline text-2xl font-medium leading-snug tracking-tight text-on-surface">
            {displayText}
            <span className="inline-block w-[2px] h-7 ml-0.5 bg-primary animate-pulse align-middle" />
          </p>
        </div>

        {/* Bottom ruled lines */}
        <div className="mt-6 space-y-4">
          <div className="h-[1px] bg-outline-variant/10" />
          <div className="flex gap-2">
            <div className="h-2 w-16 rounded bg-primary-fixed/40" />
            <div className="h-2 w-10 rounded bg-outline-variant/15" />
            <div className="h-2 w-20 rounded bg-primary-fixed/30" />
          </div>
          <div className="flex gap-2">
            <div className="h-2 w-24 rounded bg-outline-variant/15" />
            <div className="h-2 w-14 rounded bg-primary-fixed/40" />
          </div>
          <div className="h-[1px] bg-outline-variant/10" />
        </div>
      </div>

      {/* Floating accent pills */}
      <div className="animate-float-delayed absolute left-[2%] top-[55%] rounded-full bg-surface-container-low px-3 py-1.5 shadow-lg border border-outline-variant/20">
        <span className="text-xs font-medium text-primary">&#9998; Draft saved</span>
      </div>
      <div className="animate-float absolute right-[4%] top-[35%] rounded-full bg-primary-fixed/70 px-3 py-1.5 shadow-lg">
        <span className="text-xs font-medium text-on-primary-fixed">&#10084; 128 likes</span>
      </div>
      <div className="animate-float-slow absolute bottom-[25%] right-[20%] rounded-full bg-surface-container px-3 py-1.5 shadow-lg border border-outline-variant/20">
        <span className="text-xs font-medium text-on-surface-variant">&#128172; 24 replies</span>
      </div>
    </div>
  )
}

function FeaturedChronicles() {
  const articles = [
    {
      title: 'The Architecture of Silence: Finding Focus in a Noisy World',
      author: 'Eleanor Vance',
      category: 'Mindfulness',
      readTime: 8,
      likes: 342,
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    },
    {
      title: 'Why Analog Tools Still Matter for Digital Creatives',
      author: 'Julian Thorne',
      category: 'Design',
      readTime: 5,
      likes: 218,
      image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&q=80',
    },
    {
      title: 'The Morning Ritual: Creating Space Before the Day Begins',
      author: 'Sarah Jenkins',
      category: 'Lifestyle',
      readTime: 6,
      likes: 189,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    },
  ]

  return (
    <section className="bg-surface-container-low px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Editor's Picks</p>
            <h2 className="font-headline text-3xl font-semibold tracking-tight text-on-surface md:text-4xl">Featured Chronicles</h2>
            <p className="mt-3 max-w-lg text-base text-on-surface-variant">Curated selections from our most thoughtful contributors.</p>
          </div>
          <Link to="/feed" className="hidden items-center gap-1 rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface md:flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Magazine grid: 1 large + 2 stacked */}
        <div className="grid gap-6 md:grid-cols-5 md:grid-rows-2">
          {/* Large hero card */}
          <Link to="/feed" className="group relative col-span-full overflow-hidden rounded-3xl md:col-span-3 md:row-span-2">
            <div className="aspect-[4/3] md:aspect-auto md:h-full">
              <img src={articles[0].image} alt={articles[0].title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">{articles[0].category}</span>
                <span className="flex items-center gap-1 text-xs text-white/80"><Clock className="h-3 w-3" /> {articles[0].readTime} min</span>
                <span className="flex items-center gap-1 text-xs text-white/80"><Heart className="h-3 w-3" /> {articles[0].likes}</span>
              </div>
              <h3 className="font-headline text-2xl font-semibold leading-snug text-white md:text-3xl">{articles[0].title}</h3>
              <p className="mt-3 text-sm text-white/70">By {articles[0].author}</p>
            </div>
          </Link>

          {/* Two stacked smaller cards */}
          {articles.slice(1).map((article, i) => (
            <Link key={i} to="/feed" className="group relative overflow-hidden rounded-2xl md:col-span-2">
              <div className="aspect-[16/10]">
                <img src={article.image} alt={article.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">{article.category}</span>
                  <span className="flex items-center gap-1 text-[10px] text-white/80"><Clock className="h-2.5 w-2.5" /> {article.readTime} min</span>
                </div>
                <h3 className="font-headline text-lg font-medium leading-snug text-white">{article.title}</h3>
                <p className="mt-1.5 text-xs text-white/70">By {article.author}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile view-all */}
        <div className="mt-8 text-center md:hidden">
          <Link to="/feed" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all chronicles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function AboutCreator() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl bg-surface-container p-10 md:p-16">
          {/* Background decorative elements */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-primary-fixed/10 blur-2xl" />

          <div className="relative z-10 flex flex-col items-center gap-10 md:flex-row md:gap-16">
            {/* Avatar / Visual */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="h-36 w-36 overflow-hidden rounded-3xl shadow-xl">
                  <img src={creatorPhoto} alt="Abhinandan Gupta" className="h-full w-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low shadow-md border border-outline-variant/20">
                  <span className="text-lg">&#9997;&#65039;</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Created by</p>
              <h2 className="font-headline text-3xl font-semibold tracking-tight text-on-surface md:text-4xl">Abhinandan Gupta</h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-on-surface-variant">
                Full-stack developer and design enthusiast. Blogosphere is built as a space where writing is treated as craft &mdash; thoughtful, intentional, and beautifully presented. Every pixel is placed with purpose.
              </p>

              {/* Social links */}
              <div className="mt-8 flex items-center justify-center gap-3 md:justify-start flex-wrap">
                <a
                  href="https://github.com/Abhinandan-4321"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface"
                >
                  <Github className="h-4 w-4" /> GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/hey-abhinandan-gupta/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface"
                >
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
                <a
                  href="mailto:abhinandan.develops@gmail.com"
                  className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface"
                >
                  <Mail className="h-4 w-4" /> Email
                </a>
              </div>

              {/* Buy Me Coffee */}
              <div className="mt-6 flex justify-center md:justify-start">
                <BuyMeCoffee />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <div className="warm-top-accent min-h-screen bg-surface text-on-surface">
      <Header />

      {/* Hero — Left/Right split */}
      <section className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-8 px-6 pt-24 md:grid-cols-2">
        {/* Left: Text */}
        <div className="max-w-lg">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">The Writer's Circle</p>
          <h1 className="font-headline text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            Curate your thoughts.{' '}
            <span className="text-on-surface-variant">Craft your world.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-on-surface-variant">
            A sanctuary for considered writing. Share stories, collaborate in real-time, and connect with a community that values depth over speed.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link to="/register" className="rounded-xl bg-primary px-8 py-3 text-center text-sm font-medium text-on-primary transition hover:bg-primary-container hover:text-on-primary-container">
              Start Writing
            </Link>
            <Link to="/feed" className="rounded-xl border border-outline-variant px-8 py-3 text-center text-sm font-medium text-on-surface transition hover:bg-surface-container">
              Explore Feed
            </Link>
          </div>
        </div>

        {/* Right: Typewriter */}
        <div className="hidden md:block">
          <TypewriterHero />
        </div>
      </section>

      {/* Featured Chronicles */}
      <FeaturedChronicles />

      {/* About Creator */}
      <AboutCreator />

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 bg-surface-container-low px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <span className="font-display text-xl italic tracking-tight text-on-surface">Blogosphere</span>
              <p className="mt-1 text-xs text-on-surface-variant">A sanctuary for considered writing.</p>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/feed" className="text-sm text-on-surface-variant transition hover:text-primary">Feed</Link>
              <Link to="/register" className="text-sm text-on-surface-variant transition hover:text-primary">Join</Link>
              <a href="https://github.com/Abhinandan-4321" target="_blank" rel="noopener noreferrer" className="text-on-surface-variant transition hover:text-primary"><Github className="h-4 w-4" /></a>
              <a href="https://www.linkedin.com/in/hey-abhinandan-gupta/" target="_blank" rel="noopener noreferrer" className="text-on-surface-variant transition hover:text-primary"><Linkedin className="h-4 w-4" /></a>
            </nav>
          </div>
          <div className="mt-8 border-t border-outline-variant/15 pt-6 text-center">
            <p className="text-xs text-on-surface-variant">&copy; 2026 Blogosphere. Crafted with intention by Abhinandan Gupta.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
