import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Users, Heart, Calendar, MapPin, Search, X, ArrowUpDown } from 'lucide-react';
import type { MissionTrip } from '../../shared/types/MissionTrip';
import { useCountUp } from '../../shared/hooks/useCountUp';
import SkeletonCard from './SkeletonCard';

interface DashboardProps {
  trips: MissionTrip[];
  onTripSelect: (trip: MissionTrip) => void;
}

export default function Dashboard({ trips, onTripSelect }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'people'>('date-desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const totalPeopleReached = trips.reduce((sum, trip) => sum + (trip.peopleReached || 0), 0);
  const countriesVisited = new Set(trips.map(trip => trip.country)).size;
  const totalTrips = trips.length;

  const animatedCountries = useCountUp(countriesVisited, 4000);
  const animatedTrips = useCountUp(totalTrips, 4000);
  const animatedPeople = useCountUp(totalPeopleReached, 5000);

  const years = Array.from(new Set(trips.map(trip => {
    const match = trip.date.match(/\d{4}/);
    return match ? match[0] : '';
  }).filter(Boolean))).sort().reverse();

  const countries = Array.from(new Set(trips.map(trip => trip.country))).sort();

  const upcomingTrips = trips.filter(trip => trip.status === 'upcoming');
  const completedTrips = trips.filter(trip => trip.status !== 'upcoming');

  const filteredTrips = completedTrips.filter(trip => {
    const matchesSearch = searchQuery === '' ||
      trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesYear = selectedYear === 'all' || trip.date.includes(selectedYear);
    const matchesCountry = selectedCountry === 'all' || trip.country === selectedCountry;

    return matchesSearch && matchesYear && matchesCountry;
  }).sort((a, b) => {
    if (sortBy === 'date-desc') {
      const yearA = parseInt(a.date.match(/\d{4}/)?.[0] || '0');
      const yearB = parseInt(b.date.match(/\d{4}/)?.[0] || '0');
      return yearB - yearA;
    } else if (sortBy === 'date-asc') {
      const yearA = parseInt(a.date.match(/\d{4}/)?.[0] || '0');
      const yearB = parseInt(b.date.match(/\d{4}/)?.[0] || '0');
      return yearA - yearB;
    } else if (sortBy === 'people') {
      return (b.peopleReached || 0) - (a.peopleReached || 0);
    }
    return 0;
  });

  const stats = [
    { icon: Globe, label: 'Countries', value: animatedCountries, displayValue: animatedCountries.toString(), color: 'from-mission-500 to-mission-700', animate: true },
    { icon: MapPin, label: 'Mission Trips', value: animatedTrips, displayValue: animatedTrips.toString(), color: 'from-faith-sage to-green-700', animate: true },
    { icon: Users, label: 'People Reached', value: animatedPeople, displayValue: animatedPeople.toLocaleString(), color: 'from-purple-500 to-purple-700', animate: true },
    { icon: Heart, label: 'Lives Changed', value: '∞', displayValue: '∞', color: 'from-red-500 to-pink-600', animate: false },
  ];

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(14, 165, 233, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(14, 165, 233, 0.15) 0%, transparent 50%)`,
        }}
      />
      <div className="h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg p-6 hover:shadow-xl hover:shadow-mission-500/20 hover:border-mission-500 hover:scale-105 transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white">{stat.displayValue}</div>
              </div>
              <div className="text-sm text-gray-400 text-center">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {upcomingTrips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Upcoming Missions</h2>
            <div className="space-y-6">
              {upcomingTrips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => onTripSelect(trip)}
                  className="bg-gradient-to-r from-mission-900/50 to-mission-800/50 border-2 border-mission-600 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:shadow-mission-500/30 hover:border-mission-400 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 h-64 relative overflow-hidden">
                      <img
                        src={trip.images[0]}
                        alt={trip.location}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 bg-mission-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Upcoming
                      </div>
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-mission-300 transition-colors">
                            {trip.title}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="w-4 h-4" />
                            <span>{trip.location}, {trip.country}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-mission-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-semibold">{trip.date}</span>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-4 line-clamp-2">{trip.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {trip.ministryType.map((type, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-mission-600/30 border border-mission-500 text-mission-300 rounded-full text-xs font-medium"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="text-3xl font-bold text-white">Mission Timeline</h2>

            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 pl-10 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-mission-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors cursor-pointer"
              >
                <option value="all">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors cursor-pointer"
              >
                <option value="all">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>

              <div className="h-8 w-px bg-gray-700"></div>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date-desc' | 'date-asc' | 'people')}
                  className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors cursor-pointer"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="people">Most People Reached</option>
                </select>
              </div>
            </div>
          </div>

          {(searchQuery || selectedYear !== 'all' || selectedCountry !== 'all') && (
            <div className="flex items-center justify-between mb-6 px-4 py-2 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400 text-sm">
                Showing {filteredTrips.length} of {trips.length} trips
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedYear('all');
                  setSelectedCountry('all');
                }}
                className="text-mission-400 hover:text-mission-300 text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No trips found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTrips.map((trip, index) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onClick={() => onTripSelect(trip)}
                className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:shadow-mission-500/20 hover:border-mission-500 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 h-64 relative overflow-hidden">
                    <img
                      src={trip.images[0]}
                      alt={trip.location}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-mission-900 to-transparent opacity-30" />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-mission-400 transition-colors">
                          {trip.title}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>{trip.location}, {trip.country}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{trip.date}</span>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4 line-clamp-2">{trip.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {trip.ministryType.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-mission-100 text-mission-700 rounded-full text-xs font-medium"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        </div>
      </div>
    </div>
  );
}
