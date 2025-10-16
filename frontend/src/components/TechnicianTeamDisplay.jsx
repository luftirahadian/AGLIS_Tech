import React from 'react';
import { User, Star, MessageCircle, Phone, Mail } from 'lucide-react';

const TechnicianTeamDisplay = ({ team = [], leadId }) => {
  if (!team || team.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Belum ada teknisi assigned</p>
      </div>
    );
  }

  // Sort: lead first, then member, then support
  const sortedTeam = [...team].sort((a, b) => {
    const roleOrder = { lead: 1, member: 2, support: 3 };
    return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
  });

  const getRoleBadge = (role) => {
    const badges = {
      lead: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Star, label: 'LEAD' },
      member: { bg: 'bg-blue-100', text: 'text-blue-800', icon: User, label: 'MEMBER' },
      support: { bg: 'bg-purple-100', text: 'text-purple-800', icon: User, label: 'SUPPORT' }
    };
    return badges[role] || badges.member;
  };

  return (
    <div className="space-y-3">
      {sortedTeam.map((member, index) => {
        const badge = getRoleBadge(member.role);
        const Icon = badge.icon;
        const isLead = member.role === 'lead';

        return (
          <div
            key={member.id || index}
            className={`border rounded-lg p-4 ${
              isLead 
                ? 'border-yellow-300 bg-yellow-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isLead ? 'bg-yellow-200' : 'bg-blue-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    isLead ? 'text-yellow-700' : 'text-blue-600'
                  }`} />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{member.full_name}</h4>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
                      {isLead && <Star className="h-3 w-3 mr-1 fill-current" />}
                      {badge.label}
                    </span>
                  </div>

                  {member.specialization && (
                    <p className="text-sm text-gray-600 mb-2 flex items-center">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {member.specialization}
                    </p>
                  )}

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-3 text-sm">
                    {member.phone && (
                      <a
                        href={`https://wa.me/${member.phone.replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-green-600 hover:text-green-700"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {member.phone}
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        {member.email}
                      </a>
                    )}
                  </div>

                  {/* Assignment Info */}
                  {member.assigned_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Assigned: {new Date(member.assigned_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}

                  {/* Notes */}
                  {member.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      📝 {member.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Team Summary */}
      {team.length > 1 && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>👥 Tim:</strong> {team.length} teknisi •{' '}
            <strong>Lead:</strong> {team.find(t => t.role === 'lead')?.full_name || 'TBA'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TechnicianTeamDisplay;

