import { resolveImageUrl } from '../api/posts'
import { DEFAULT_HOMEPAGE_SERVICES } from '../data/homepageServices'
import { ServiceIcon } from '../data/partnershipServiceIcons'

function ServiceCard({ service }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:shadow-sky-100 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center">
      <div className="mb-5 mt-1">
        <ServiceIcon name={service.icon} size={70} className="text-sky-500" />
      </div>
      <h3 className="font-bold text-sm tracking-wide text-gray-800 mb-2 uppercase">{service.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{service.description}</p>
    </div>
  )
}

// `preview` memaksa tata letak desktop pada lebar tetap 1280px untuk editor admin.
export default function HomepageServicesSection({ services = DEFAULT_HOMEPAGE_SERVICES, preview = false }) {
  const [first, second, third, fourth] = services.services
  return (
    <section aria-label="Layanan Kami" className={`px-6 bg-white overflow-hidden ${preview ? 'py-16' : 'landing-section'}`}>
      <div className={`max-w-6xl mx-auto grid items-center ${preview ? 'grid-cols-2 gap-12' : 'grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12'}`}>
        <div className={`relative mx-auto w-full h-[420px] sm:h-[480px] ${preview ? 'order-1 max-w-none' : 'order-2 lg:order-1 max-w-sm lg:max-w-none'}`}>
          <div
            className="absolute inset-0 m-auto w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] bg-gradient-to-br from-sky-300 via-violet-300 to-emerald-200 opacity-70 blur-2xl"
            style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', animation: 'blobMorph 14s ease-in-out infinite alternate' }}
          />
          <div className="absolute top-2 left-0 sm:left-4 w-[72%] aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl ring-4 ring-white">
            <img src={resolveImageUrl(services.photo_primary_url)} alt={services.photo_primary_alt} className="w-full h-full object-cover" />
          </div>
          <div
            className="absolute bottom-2 right-0 sm:right-2 w-[58%] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white"
            style={{ animation: 'floatY 5s ease-in-out infinite' }}
          >
            <img src={resolveImageUrl(services.photo_secondary_url)} alt={services.photo_secondary_alt} className="w-full h-full object-cover" />
          </div>
          <div
            className="hidden sm:flex absolute -top-2 right-4 items-center gap-2 bg-white rounded-full shadow-lg pl-2 pr-4 py-2"
            style={{ animation: 'floatY 4.5s ease-in-out 1s infinite' }}
          >
            <span className="w-8 h-8 rounded-full bg-sky-500 text-white text-xs font-extrabold flex items-center justify-center">{services.badge_value}</span>
            <span className="text-gray-700 text-xs font-semibold">{services.badge_label}</span>
          </div>
        </div>

        <div className={preview ? 'order-2' : 'order-1 lg:order-2'}>
          <p className="text-sky-500 text-sm font-bold tracking-[0.2em] uppercase mb-3">{services.eyebrow}</p>
          <h2 className={`${preview ? 'text-4xl' : 'text-3xl md:text-4xl'} font-extrabold text-gray-900 mb-4`}>{services.title}</h2>
          <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-md">{services.description}</p>

          <div className={`grid gap-5 ${preview ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
            <div className="flex flex-col gap-5">
              {[first, second].filter(Boolean).map((service, index) => (
                <ServiceCard key={`${service.title}-${index}`} service={service} />
              ))}
            </div>
            <div className="flex flex-col gap-5 sm:mt-10">
              {[third, fourth].filter(Boolean).map((service, index) => (
                <ServiceCard key={`${service.title}-${index}`} service={service} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
