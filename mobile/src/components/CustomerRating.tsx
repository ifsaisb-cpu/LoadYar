import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';

interface CustomerRatingProps {
  onRatingSubmit: (rating: number, feedback: string) => void;
  onSkip: () => void;
}

export const CustomerRating: React.FC<CustomerRatingProps> = ({
  onRatingSubmit,
  onSkip,
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (selectedRating !== null) {
      onRatingSubmit(selectedRating, feedback);
    }
  };

  const ratingEmojis = ['😞', '😐', '🙂', '😊', '🤩'];
  const ratingLabels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>How was your delivery experience?</Text>
          <Text style={styles.subtitle}>Your feedback helps us improve</Text>
        </View>

        {/* Rating Selection */}
        <View style={styles.ratingSection}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingOption,
                  selectedRating === rating && styles.ratingOptionSelected,
                ]}
                onPress={() => setSelectedRating(rating)}
              >
                <Text style={styles.ratingEmoji}>{ratingEmojis[rating - 1]}</Text>
                <Text style={styles.ratingLabel}>{ratingLabels[rating - 1]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback Text */}
        {selectedRating !== null && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackLabel}>
              Tell us more (optional)
            </Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="What could we have done better?"
              placeholderTextColor="#999"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Quick feedback options */}
        {selectedRating !== null && selectedRating < 3 && (
          <View style={styles.issuesSection}>
            <Text style={styles.issuesLabel}>What went wrong?</Text>
            <View style={styles.issuesGrid}>
              {[
                '🚗 Late delivery',
                '📦 Package damaged',
                '😠 Driver behavior',
                '❌ Missing items',
              ].map((issue) => (
                <TouchableOpacity
                  key={issue}
                  style={[
                    styles.issueTag,
                    feedback.includes(issue) && styles.issueTagSelected,
                  ]}
                  onPress={() => {
                    if (feedback.includes(issue)) {
                      setFeedback(feedback.replace(issue, '').trim());
                    } else {
                      setFeedback((prev) => (prev ? `${prev}, ${issue}` : issue));
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.issueText,
                      feedback.includes(issue) && styles.issueTextSelected,
                    ]}
                  >
                    {issue}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            selectedRating === null && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={selectedRating === null}
        >
          <Text style={styles.submitButtonText}>Submit Rating</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  ratingSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  ratingOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  ratingOptionSelected: {
    backgroundColor: '#e0f2fe',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  ratingEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  feedbackSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
    textAlignVertical: 'top',
  },
  issuesSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  issuesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  issuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  issueTag: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  issueTagSelected: {
    backgroundColor: '#fecaca',
    borderColor: '#ef4444',
  },
  issueText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  issueTextSelected: {
    color: '#991b1b',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default CustomerRating;
