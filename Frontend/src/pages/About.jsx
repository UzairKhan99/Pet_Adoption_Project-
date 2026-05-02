import { Award, Target, Heart, Phone, Mail, MapPin, Clock } from 'lucide-react'

export default function About() {
  const team = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      image: '/professional-woman-smiling.png',
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Head of Adoptions',
      image: '/professional-man.png',
    },
    {
      id: 3,
      name: 'Emma Davis',
      role: 'Animal Care Specialist',
      image: '/professional-woman-diverse.png',
    },
  ]

  const stats = [
    { number: '5000+', label: 'Pets Adopted' },
    { number: '1000+', label: 'Happy Families' },
    { number: '50+', label: 'Partner Shelters' },
    { number: '10+', label: 'Years of Service' },
  ]

  const values = [
    {
      icon: <Heart size={32} className="text-amber-600" />,
      title: 'Compassion',
      description: 'We care deeply about every animal in our care',
    },
    {
      icon: <Target size={32} className="text-amber-600" />,
      title: 'Mission-Driven',
      description: 'Our goal is to find the perfect home for every pet',
    },
    {
      icon: <Award size={32} className="text-amber-600" />,
      title: 'Excellence',
      description: 'We maintain the highest standards of animal welfare',
    },
  ]

  return (
    <div className="w-full">
      <section className="bg-amber-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">About PetHub</h1>
          <p className="text-xl opacity-90">Connecting loving homes with deserving pets since 2014</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                At PetHub, our mission is to revolutionize pet adoption by making the process simple, transparent, and joyful. We believe every pet deserves a loving home, and every family deserves the joy of pet ownership.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                We work directly with shelters, rescue organizations, and individual pet owners to create meaningful connections between people and animals.
              </p>
            </div>
            <div className="hidden md:block">
              <img src="/happy-family-with-dogs.jpg" alt="Our mission" className="w-full rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
                <h3 className="text-4xl font-bold text-amber-600 mb-2">{stat.number}</h3>
                <p className="text-gray-600 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-8 text-center hover:shadow-lg transition">
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Our Team</h2>
          <p className="text-center text-gray-600 text-lg mb-12">Meet the passionate people behind PetHub</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member) => (
              <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="h-64 overflow-hidden bg-gray-200">
                  <img src={member.image || "/placeholder.svg"} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-amber-600 font-semibold">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-wide text-amber-600 font-semibold">Contact Us</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">We're here for adopters and partners</h2>
            <p className="text-gray-600 text-lg">
              Whether you have questions about the adoption process, want to volunteer, or need post-adoption support, our team is just a message away.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-gray-50 rounded-2xl p-8 space-y-6 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900">Visit or call us</h3>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start gap-4">
                  <MapPin className="text-amber-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Shelter & HQ</p>
                    <p>125 Pawprint Avenue, Suite 200<br />Seattle, WA 98109</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="text-amber-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Adoption Support</p>
                    <p>(206) 555-0134</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="text-amber-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Hours</p>
                    <p>Monday - Saturday: 9am - 7pm<br />Sunday: 10am - 4pm</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 space-y-6 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900">Message our team</h3>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start gap-4">
                  <Mail className="text-amber-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">General Inquiries</p>
                    <p>hello@pethub.org</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="text-amber-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Adoption Applications</p>
                    <p>adoptions@pethub.org</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="text-amber-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Partnerships</p>
                    <p>partners@pethub.org</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                Prefer a form? Use our detailed contact form on the Contact page and we'll respond within one business day.
              </p>
              <a
                href="mailto:hello@pethub.org"
                className="inline-flex items-center justify-center rounded-lg bg-amber-600 text-white px-6 py-3 font-semibold hover:bg-amber-700 transition"
              >
                Send us an email
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
