import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faStarHalfAlt } from "@fortawesome/free-solid-svg-icons";
import { faStar as farStar } from "@fortawesome/free-regular-svg-icons";

const Rating = ({ value, numReviews }) => {
  return (
    <div className="rating" style={{ color: "#2c5aa0" }}>
      {[...Array(5)].map((_, i) => {
        const ratingValue = i + 1;
        return (
          <span key={i}>
            {value >= ratingValue ? (
              <FontAwesomeIcon icon={faStar} color="#2c5aa0" />
            ) : value >= ratingValue - 0.5 ? (
              <FontAwesomeIcon icon={faStarHalfAlt} color="#2c5aa0" />
            ) : (
              <FontAwesomeIcon icon={farStar} color="#2c5aa0" />
            )}
          </span>
        );
      })}
      <span className="ms-2">{numReviews} reviews</span>
    </div>
  );
};

export default Rating;
