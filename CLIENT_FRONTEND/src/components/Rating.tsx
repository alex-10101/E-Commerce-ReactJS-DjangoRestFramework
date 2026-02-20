/**
 *
 * @param value: the rating of the product (a number from 0 to 5)
 * @param text: the number of reviews of the product: "(numReviews) + reviews"
 * @param color: the color of the star (here yellow)
 *
 * @returns Component which shows the rating of a product (how many stars out of a total of five).
 */
function Rating({
  value,
  text,
  color,
}: {
  value: number;
  text: string;
  color: string;
}) {
  return (
    <div className="rating">
      {/* 1st star from the left (should be colored only if rating >= 1)*/}
      <span>
        <i
          style={{ color }}
          className={
            value >= 1
              ? // if the rating value is at least 1, the star should be full yellow
                "fas fa-star"
              : value >= 0.5
              ? // else, if the rating is less than 1, but greater than 0.5, then only half of the star should be yellow
                "fas fa-star-half-alt"
              : // else, if the rating is less than 0.5, the star should be empty (white)
                "far fa-star"
          }
        ></i>
      </span>

      {/* 2nd star from the left (should be colored only if rating >= 2)*/}
      <span>
        <i
          style={{ color }}
          className={
            value >= 2
              ? // if the rating value is at least 2, the star should be full yellow
                "fas fa-star"
              : value >= 1.5
              ? // else, if the rating is less than 2, but greater than 1.5, then only half of the star should be yellow
                "fas fa-star-half-alt"
              : // else, if the rating is less than 1.5, the star should be empty (white)
                "far fa-star"
          }
        ></i>
      </span>

      {/* 3rd star from the left (should be colored only if rating >= 3)*/}
      <span>
        <i
          style={{ color }}
          className={
            value >= 3
              ? "fas fa-star"
              : value >= 2.5
              ? "fas fa-star-half-alt"
              : "far fa-star"
          }
        ></i>
      </span>

      {/* 4th star from the left (should be colored only if rating >= 4)*/}
      <span>
        <i
          style={{ color }}
          className={
            value >= 4
              ? "fas fa-star"
              : value >= 3.5
              ? "fas fa-star-half-alt"
              : "far fa-star"
          }
        ></i>
      </span>

      {/* 5th star from the left (should be colored only if rating >= 5)*/}
      <span>
        <i
          style={{ color }}
          className={
            value >= 5
              ? "fas fa-star"
              : value >= 4.5
              ? "fas fa-star-half-alt"
              : "far fa-star"
          }
        ></i>
      </span>

      {/* the total number of reviews: "(numReviews) + reviews" */}
      <span>{text && text}</span>
    </div>
  );
}

export default Rating;
